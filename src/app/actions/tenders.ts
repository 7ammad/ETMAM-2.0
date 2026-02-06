"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

/** Normalize date string to YYYY-MM-DD for DB DATE column */
function normalizeDeadline(val: string): string | null {
  const trimmed = val.trim();
  if (!trimmed) return null;
  const date = new Date(trimmed);
  if (!Number.isNaN(date.getTime())) {
    return date.toISOString().split("T")[0];
  }
  const parts = trimmed.split("/");
  if (parts.length === 3) {
    const [d, m, y] = parts;
    const year = y.length === 4 ? y : y.length === 2 ? `20${y}` : "";
    const month = m.padStart(2, "0");
    const day = d.padStart(2, "0");
    if (year && month && day) return `${year}-${month}-${day}`;
  }
  return null;
}

const tenderInputSchema = z.object({
  entity: z.string().min(1, "الجهة مطلوبة"),
  tender_title: z.string().min(1, "عنوان المنافسة مطلوب"),
  tender_number: z.string().min(1, "رقم المنافسة مطلوب"),
  deadline: z.string().min(1).refine(
    (val) => normalizeDeadline(val) !== null,
    { message: "صيغة التاريخ غير صحيحة" }
  ),
  estimated_value: z.number().positive("القيمة يجب أن تكون موجبة"),
  description: z.string().optional(),
  requirements: z.string().optional(),
});

type TenderInput = z.infer<typeof tenderInputSchema>;

export type SavePdfTenderResult =
  | { success: true; tenderId: string }
  | { success: false; error: string };

export async function savePdfTender(input: {
  entity: string;
  tender_title: string;
  tender_number: string;
  deadline: string;
  estimated_value: number;
  description: string | null;
  requirements: string[];
  line_items: {
    description: string;
    quantity: number | null;
    unit: string | null;
    confidence: number;
  }[];
  extraction_confidence: number;
  extraction_warnings: string[];
  source_file_name: string;
}): Promise<SavePdfTenderResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: "يجب تسجيل الدخول" };
  }

  const deadline = normalizeDeadline(input.deadline);
  if (!deadline) {
    return { success: false, error: "صيغة التاريخ غير صحيحة" };
  }

  // --- Sanity checks on user-edited values ---
  if (!input.entity.trim()) {
    return { success: false, error: "الجهة مطلوبة" };
  }
  if (!input.tender_title.trim()) {
    return { success: false, error: "عنوان المنافسة مطلوب" };
  }
  if (!input.tender_number.trim()) {
    return { success: false, error: "رقم المنافسة مطلوب" };
  }
  if (input.estimated_value <= 0) {
    return { success: false, error: "القيمة التقديرية يجب أن تكون موجبة" };
  }
  if (input.estimated_value > 10_000_000_000) {
    return {
      success: false,
      error: "القيمة التقديرية مرتفعة بشكل غير معقول — يرجى التحقق",
    };
  }

  const { data, error } = await supabase
    .from("tenders")
    .insert({
      user_id: user.id,
      entity: input.entity,
      tender_title: input.tender_title,
      tender_number: input.tender_number,
      deadline,
      estimated_value: input.estimated_value,
      description: input.description,
      requirements: input.requirements,
      line_items: input.line_items,
      source_type: "pdf" as const,
      source_file_name: input.source_file_name,
      source_file_path: null,
      extraction_confidence: input.extraction_confidence,
      extraction_warnings: input.extraction_warnings,
      status: "new" as const,
    })
    .select("id")
    .single();

  if (error) {
    return { success: false, error: "فشل حفظ المنافسة: " + error.message };
  }

  revalidatePath("/tenders");
  return { success: true, tenderId: data.id };
}

export type UploadTendersResult =
  | { success: true; created: number; tenders: unknown[] }
  | { success: false; error: string };

export async function uploadTenders(
  tenders: unknown[]
): Promise<UploadTendersResult> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: "يجب تسجيل الدخول" };
  }

  const validated: TenderInput[] = [];
  for (const t of tenders) {
    const raw = t as Record<string, unknown>;
    const deadlineStr = (raw.deadline as string) ?? "";
    const deadlineNorm = normalizeDeadline(deadlineStr);
    const parsed = tenderInputSchema.safeParse({
      ...raw,
      deadline: deadlineNorm ?? deadlineStr,
    });
    if (parsed.success && deadlineNorm) {
      validated.push({
        ...parsed.data,
        deadline: deadlineNorm,
      });
    }
  }

  if (validated.length === 0) {
    return { success: false, error: "لا توجد منافسات صالحة للرفع" };
  }

  const dbTenders = validated.map((tender) => ({
    user_id: user.id,
    entity: tender.entity,
    tender_title: tender.tender_title,
    tender_number: tender.tender_number,
    deadline: tender.deadline,
    estimated_value: tender.estimated_value,
    description: tender.description ?? null,
    requirements: tender.requirements
      ? tender.requirements.split("\n").filter((r) => r.trim())
      : [],
    source_type: "csv" as const,
    source_file_name: null,
    source_file_path: null,
    status: "new" as const,
    line_items: [],
    extraction_warnings: [],
  }));

  const { data, error } = await supabase
    .from("tenders")
    .insert(dbTenders)
    .select();

  if (error) {
    return {
      success: false,
      error: "فشل حفظ المنافسات: " + error.message,
    };
  }

  revalidatePath("/tenders");
  return {
    success: true,
    created: data?.length ?? 0,
    tenders: data ?? [],
  };
}
