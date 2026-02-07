"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { CostItem } from "@/types/database";

export type CostItemListItem = CostItem;

export type ListCostItemsResult =
  | { success: true; items: CostItemListItem[] }
  | { success: false; error: string };

export async function listCostItems(tenderId: string): Promise<ListCostItemsResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: "يجب تسجيل الدخول" };
  }

  const { data, error } = await supabase
    .from("cost_items")
    .select("*")
    .eq("tender_id", tenderId)
    .eq("user_id", user.id)
    .order("sort_order", { ascending: true });

  if (error) return { success: false, error: error.message };
  return { success: true, items: (data ?? []) as CostItemListItem[] };
}

export type CreateCostItemInput = {
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  category?: "direct" | "indirect";
  source?: "rate_card" | "manual" | "ai_suggested";
  rate_card_item_id?: string | null;
  source_notes?: string | null;
};

export type CreateCostItemResult =
  | { success: true; id: string }
  | { success: false; error: string };

export async function createCostItem(
  tenderId: string,
  input: CreateCostItemInput
): Promise<CreateCostItemResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: "يجب تسجيل الدخول" };
  }

  const desc = input.description?.trim();
  if (!desc) return { success: false, error: "البند مطلوب" };
  const qty = Number(input.quantity);
  const up = Number(input.unit_price);
  if (qty < 0 || up < 0) return { success: false, error: "الكمية وسعر الوحدة يجب أن يكونا غير سالبين" };

  const { data, error } = await supabase
    .from("cost_items")
    .insert({
      tender_id: tenderId,
      user_id: user.id,
      category: input.category ?? "direct",
      description: desc,
      quantity: qty,
      unit: input.unit?.trim() || "وحدة",
      unit_price: up,
      source: input.source ?? "manual",
      rate_card_item_id: input.rate_card_item_id ?? null,
      source_notes: input.source_notes ?? null,
      sort_order: 0,
    })
    .select("id")
    .single();

  if (error) return { success: false, error: error.message };
  revalidatePath(`/tenders/${tenderId}`);
  return { success: true, id: data.id };
}

export type UpdateCostItemResult = { success: true } | { success: false; error: string };

export async function updateCostItem(
  id: string,
  input: Partial<{
    description: string;
    quantity: number;
    unit: string;
    unit_price: number;
    category: "direct" | "indirect";
    source: "rate_card" | "manual" | "ai_suggested";
    rate_card_item_id: string | null;
    source_notes: string | null;
  }>
): Promise<UpdateCostItemResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: "يجب تسجيل الدخول" };
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (input.description !== undefined) updates.description = input.description.trim();
  if (input.quantity !== undefined) updates.quantity = Number(input.quantity);
  if (input.unit !== undefined) updates.unit = input.unit.trim() || "وحدة";
  if (input.unit_price !== undefined) updates.unit_price = Number(input.unit_price);
  if (input.category !== undefined) updates.category = input.category;
  if (input.source !== undefined) updates.source = input.source;
  if (input.rate_card_item_id !== undefined) updates.rate_card_item_id = input.rate_card_item_id;
  if (input.source_notes !== undefined) updates.source_notes = input.source_notes;

  const { data: row, error } = await supabase
    .from("cost_items")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.id)
    .select("tender_id")
    .single();

  if (error) return { success: false, error: error.message };
  if (row?.tender_id) revalidatePath(`/tenders/${row.tender_id}`);
  return { success: true };
}

export type DeleteCostItemResult = { success: true } | { success: false; error: string };

export async function deleteCostItem(id: string): Promise<DeleteCostItemResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: "يجب تسجيل الدخول" };
  }

  const { data: row } = await supabase
    .from("cost_items")
    .select("tender_id")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  const { error } = await supabase
    .from("cost_items")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { success: false, error: error.message };
  if (row?.tender_id) revalidatePath(`/tenders/${row.tender_id}`);
  return { success: true };
}

export type UpdateTenderBidPriceResult = { success: true } | { success: false; error: string };

export async function updateTenderBidPrice(
  tenderId: string,
  proposedPrice: number | null
): Promise<UpdateTenderBidPriceResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: "يجب تسجيل الدخول" };
  }

  const value = proposedPrice != null && Number(proposedPrice) >= 0 ? Number(proposedPrice) : null;
  const { error } = await supabase
    .from("tenders")
    .update({ proposed_price: value, updated_at: new Date().toISOString() })
    .eq("id", tenderId)
    .eq("user_id", user.id);

  if (error) return { success: false, error: error.message };
  revalidatePath(`/tenders/${tenderId}`);
  return { success: true };
}

export type MatchItem = { description: string; quantity: number; unit: string };

export type MatchResultItem = {
  description: string;
  quantity: number;
  unit: string;
  matched: boolean;
  rate_card_item?: {
    id: string;
    item_name: string;
    unit: string;
    unit_price: number;
    rate_card_name: string;
  };
  suggested_price?: number;
  match_confidence: number;
  requires_manual_price: boolean;
};

export type MatchCostItemsResult =
  | { success: true; matches: MatchResultItem[] }
  | { success: false; error: string };

export async function matchCostItems(
  tenderId: string,
  items: MatchItem[]
): Promise<MatchCostItemsResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: "يجب تسجيل الدخول" };
  }

  const { data: rateCardItems, error: rciError } = await supabase
    .from("rate_card_items")
    .select("id, item_name, category, unit, unit_price, rate_card_id")
    .eq("user_id", user.id);

  if (rciError) return { success: false, error: rciError.message };

  const rciList = (rateCardItems ?? []) as Array<{
    id: string;
    item_name: string;
    category: string | null;
    unit: string;
    unit_price: number;
    rate_card_id: string;
  }>;

  const cardIds = [...new Set(rciList.map((r) => r.rate_card_id))];
  const cardNames: Record<string, string> = {};
  if (cardIds.length > 0) {
    const { data: cards } = await supabase
      .from("rate_cards")
      .select("id, name")
      .in("id", cardIds);
    for (const c of cards ?? []) {
      cardNames[(c as { id: string; name: string }).id] = (c as { id: string; name: string }).name;
    }
  }

  const matches: MatchResultItem[] = items.map((item) => {
    const descNorm = item.description.trim().toLowerCase();
    let best: { score: number; rci: (typeof rciList)[0] } | null = null;

    for (const rci of rciList) {
      const nameNorm = (rci.item_name || "").toLowerCase();
      const catNorm = (rci.category || "").toLowerCase();
      const searchText = `${nameNorm} ${catNorm}`.trim();
      let score = 0;
      if (searchText.includes(descNorm) || descNorm.includes(nameNorm)) {
        score = 0.9;
      } else if (nameNorm.includes(descNorm)) {
        score = 0.85;
      } else {
        const words = descNorm.split(/\s+/).filter(Boolean);
        const matchCount = words.filter((w) => searchText.includes(w)).length;
        if (words.length > 0) score = (matchCount / words.length) * 0.8;
      }
      if (score > 0.5 && (!best || score > best.score)) {
        best = { score, rci };
      }
    }

    if (best) {
      return {
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        matched: true,
        rate_card_item: {
          id: best.rci.id,
          item_name: best.rci.item_name,
          unit: best.rci.unit,
          unit_price: best.rci.unit_price,
          rate_card_name: cardNames[best.rci.rate_card_id] ?? "",
        },
        suggested_price: best.rci.unit_price,
        match_confidence: Math.round(best.score * 100),
        requires_manual_price: false,
      };
    }
    return {
      description: item.description,
      quantity: item.quantity,
      unit: item.unit,
      matched: false,
      match_confidence: 0,
      requires_manual_price: true,
    };
  });

  return { success: true, matches };
}

// ---------------------------------------------------------------------------
// Seed cost items from tender's extracted line_items (PDF BOQ)
// ---------------------------------------------------------------------------

export type SeedFromLineItemsResult =
  | { success: true; created: number }
  | { success: false; error: string };

export async function seedCostItemsFromLineItems(
  tenderId: string
): Promise<SeedFromLineItemsResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: "يجب تسجيل الدخول" };
  }

  // Fetch the tender's line_items
  const { data: tender, error: tenderError } = await supabase
    .from("tenders")
    .select("line_items")
    .eq("id", tenderId)
    .eq("user_id", user.id)
    .single();

  if (tenderError || !tender) {
    return { success: false, error: "لم يتم العثور على المنافسة" };
  }

  const lineItems = Array.isArray(tender.line_items) ? tender.line_items : [];
  if (lineItems.length === 0) {
    return { success: false, error: "لا توجد بنود مستخرجة من ملف PDF" };
  }

  const costItems = lineItems.map((item: Record<string, unknown>, idx: number) => ({
    tender_id: tenderId,
    user_id: user.id,
    category: "direct" as const,
    description: String(item.description ?? "بند غير مسمى"),
    quantity: Number(item.quantity) || 1,
    unit: String(item.unit ?? "وحدة"),
    unit_price: 0,
    source: "ai_suggested" as const,
    source_notes: `استخرج من PDF (ثقة ${Number(item.confidence) || 0}%)`,
    sort_order: idx,
  }));

  const { error: insertError } = await supabase
    .from("cost_items")
    .insert(costItems);

  if (insertError) {
    return { success: false, error: "فشل إنشاء بنود التكلفة: " + insertError.message };
  }

  revalidatePath(`/tenders/${tenderId}`);
  return { success: true, created: costItems.length };
}
