"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { RateCard } from "@/types/database";
import {
  parseRateCardCSV,
  parseRateCardExcel,
  type ParsedRateCardRow,
} from "@/lib/utils/rate-card-parser";

const BUCKET = "rate-card-files";
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export type RateCardListItem = Pick<
  RateCard,
  "id" | "name" | "file_name" | "item_count" | "valid_until" | "created_at"
>;

export type ListRateCardsResult =
  | { success: true; cards: RateCardListItem[] }
  | { success: false; error: string };

export async function listRateCards(): Promise<ListRateCardsResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: "يجب تسجيل الدخول" };
  }

  const { data, error } = await supabase
    .from("rate_cards")
    .select("id, name, file_name, item_count, valid_until, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true, cards: (data ?? []) as RateCardListItem[] };
}

export type UploadRateCardResult =
  | { success: true; id: string }
  | { success: false; error: string };

export async function uploadRateCard(formData: FormData): Promise<UploadRateCardResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: "يجب تسجيل الدخول" };
  }

  const file = formData.get("file") as File | null;
  const nameInput = formData.get("name") as string | null;
  if (!file || file.size === 0) {
    return { success: false, error: "لم يتم اختيار ملف" };
  }
  if (file.size > MAX_FILE_SIZE) {
    return { success: false, error: "حجم الملف يتجاوز 5 ميجابايت" };
  }

  const ext = (file.name.split(".").pop() ?? "").toLowerCase();
  if (!["csv", "xlsx", "xls"].includes(ext)) {
    return { success: false, error: "نوع الملف غير مدعوم. استخدم CSV أو Excel." };
  }

  let rows: ParsedRateCardRow[];
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    if (ext === "csv") {
      const text = buffer.toString("utf-8");
      const result = parseRateCardCSV(text);
      rows = result.rows;
    } else {
      const result = parseRateCardExcel(buffer.buffer as ArrayBuffer);
      rows = result.rows;
    }
  } catch (e) {
    return { success: false, error: "تعذر قراءة الملف" };
  }

  if (rows.length === 0) {
    return { success: false, error: "لم يتم العثور على بنود صالحة (البند، الوحدة، سعر الوحدة)" };
  }

  const label = (nameInput?.trim() || file.name).slice(0, 255);
  const id = crypto.randomUUID();
  const filePath = `${user.id}/${id}/${file.name}`;

  const { error: insertError } = await supabase.from("rate_cards").insert({
    id,
    user_id: user.id,
    name: label,
    file_path: filePath,
    file_name: file.name,
    item_count: 0,
  });

  if (insertError) {
    return { success: false, error: insertError.message };
  }

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, file, { upsert: true });

  if (uploadError) {
    await supabase.from("rate_cards").delete().eq("id", id);
    return { success: false, error: "فشل رفع الملف: " + uploadError.message };
  }

  const items = rows.map((r) => ({
    rate_card_id: id,
    user_id: user.id,
    item_name: r.item_name,
    category: r.category,
    unit: r.unit,
    unit_price: r.unit_price,
    brand: r.brand ?? null,
    model_sku: r.model_sku ?? null,
    specifications: r.specifications ?? null,
  }));

  const { error: itemsError } = await supabase.from("rate_card_items").insert(items);
  if (itemsError) {
    await supabase.storage.from(BUCKET).remove([filePath]);
    await supabase.from("rate_cards").delete().eq("id", id);
    return { success: false, error: itemsError.message };
  }

  revalidatePath("/settings");
  return { success: true, id };
}

export type DeleteRateCardResult =
  | { success: true }
  | { success: false; error: string };

export async function deleteRateCard(id: string): Promise<DeleteRateCardResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: "يجب تسجيل الدخول" };
  }

  const { data: card } = await supabase
    .from("rate_cards")
    .select("id, file_path")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!card) {
    return { success: false, error: "لم يتم العثور على البطاقة" };
  }

  const { error: deleteError } = await supabase.from("rate_cards").delete().eq("id", id);
  if (deleteError) {
    return { success: false, error: deleteError.message };
  }

  try {
    await supabase.storage.from(BUCKET).remove([card.file_path]);
  } catch {
    // Best-effort: storage DELETE may not be allowed by policy; row is already deleted
  }
  revalidatePath("/settings");
  return { success: true };
}
