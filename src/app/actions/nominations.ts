"use server";

import { createClient } from "@/lib/supabase/server";
import { buildProductNominationPrompt } from "@/lib/ai/prompts";
import { extractJSON, nominationsResponseSchema } from "@/lib/ai/parser";
import { verifyNominations } from "@/lib/ai/verification";
import { revalidatePath } from "next/cache";
import type { SpecCard, ProductNomination } from "@/types/spec-cards";
import type { BOQItem, ExtractedSections } from "@/types/extracted-sections";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type NominateProductsResult =
  | { success: true; nominations: ProductNomination[] }
  | { success: false; error: string };

export type NominateProductsBatchResult =
  | { success: true; totalNominations: number }
  | { success: false; error: string };

export type ListNominationsResult =
  | { success: true; nominations: ProductNomination[] }
  | { success: false; error: string };

export type SelectNominationResult =
  | { success: true }
  | { success: false; error: string };

export type AddManualNominationResult =
  | { success: true; id: string }
  | { success: false; error: string };

export type DeleteNominationResult =
  | { success: true }
  | { success: false; error: string };

export type UpdateNominationResult =
  | { success: true }
  | { success: false; error: string };

export type SelectAllBestResult =
  | { success: true; selectedCount: number }
  | { success: false; error: string };

export type ApplyNominationsResult =
  | { success: true; count: number }
  | { success: false; error: string };

// ---------------------------------------------------------------------------
// Fuzzy matching helper (reused from costs.ts matchCostItems pattern)
// ---------------------------------------------------------------------------

interface RateCardItemRow {
  id: string;
  item_name: string;
  category: string | null;
  unit: string;
  unit_price: number;
  rate_card_id: string;
  brand: string | null;
  model_sku: string | null;
  specifications: unknown;
}

interface FuzzyMatch {
  score: number;
  rci: RateCardItemRow;
}

function fuzzyMatchRateCardItems(
  searchText: string,
  rateCardItems: RateCardItemRow[],
  topN: number = 5
): FuzzyMatch[] {
  const descNorm = searchText.trim().toLowerCase();
  const matches: FuzzyMatch[] = [];

  for (const rci of rateCardItems) {
    const nameNorm = (rci.item_name || "").toLowerCase();
    const catNorm = (rci.category || "").toLowerCase();
    const specNorm = typeof rci.specifications === "string"
      ? rci.specifications.toLowerCase()
      : "";
    const combined = `${nameNorm} ${catNorm} ${specNorm}`.trim();
    let score = 0;

    if (combined.includes(descNorm) || descNorm.includes(nameNorm)) {
      score = 0.9;
    } else if (nameNorm.includes(descNorm)) {
      score = 0.85;
    } else {
      const words = descNorm.split(/\s+/).filter(Boolean);
      const matchCount = words.filter((w) => combined.includes(w)).length;
      if (words.length > 0) score = (matchCount / words.length) * 0.8;
    }

    if (score > 0.3) {
      matches.push({ score, rci });
    }
  }

  // Sort by score desc and take top N
  matches.sort((a, b) => b.score - a.score);
  return matches.slice(0, topN);
}

// ---------------------------------------------------------------------------
// Helper: Direct AI call with custom prompt
// ---------------------------------------------------------------------------

async function callAIWithPrompt(prompt: string): Promise<string> {
  // Try DeepSeek first
  const deepseekKey = process.env.DEEPSEEK_API_KEY?.trim();
  if (deepseekKey) {
    const res = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${deepseekKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: "أنت خبير مشتريات ومطابقة منتجات متخصص. أجب بـ JSON فقط." },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 4000,
        stream: false,
        response_format: { type: "json_object" },
      }),
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`DeepSeek API error: ${res.status} ${errText}`);
    }
    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    return data?.choices?.[0]?.message?.content ?? "";
  }

  // Try Gemini
  const geminiKey = process.env.GEMINI_API_KEY?.trim();
  if (geminiKey) {
    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(geminiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    return result.response.text();
  }

  // Try Groq
  const groqKey = process.env.GROQ_API_KEY?.trim();
  if (groqKey) {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${groqKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: "أنت خبير مشتريات ومطابقة منتجات متخصص. أجب بـ JSON فقط." },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 4000,
        response_format: { type: "json_object" },
      }),
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Groq API error: ${res.status} ${errText}`);
    }
    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    return data?.choices?.[0]?.message?.content ?? "";
  }

  // Mock fallback
  if (process.env.MOCK_AI === "true") {
    return JSON.stringify({
      nominations: [],
      warnings: ["وضع المحاكاة — لا يوجد مزود ذكاء اصطناعي متاح"],
    });
  }

  throw new Error("لا يوجد مزود ذكاء اصطناعي متاح. يرجى إعداد مفتاح API.");
}

// ---------------------------------------------------------------------------
// 1. nominateProducts — AI-nominate products for a single spec card
// ---------------------------------------------------------------------------

export async function nominateProducts(specCardId: string): Promise<NominateProductsResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: "يجب تسجيل الدخول" };
  }

  // Fetch the spec card
  const { data: specCard, error: scError } = await supabase
    .from("spec_cards")
    .select("*")
    .eq("id", specCardId)
    .eq("user_id", user.id)
    .single();

  if (scError || !specCard) {
    return { success: false, error: "بطاقة المواصفات غير موجودة" };
  }

  // Fetch user's rate_card_items (all of them)
  const { data: rateCardItems, error: rciError } = await supabase
    .from("rate_card_items")
    .select("id, item_name, category, unit, unit_price, rate_card_id, brand, model_sku, specifications")
    .eq("user_id", user.id);

  if (rciError) {
    return { success: false, error: rciError.message };
  }

  const rciList = (rateCardItems ?? []) as RateCardItemRow[];

  // Build search text from spec card's boq_description + parameters
  const paramText = Array.isArray(specCard.parameters)
    ? (specCard.parameters as Array<{ name: string; value: string }>)
        .map((p) => `${p.name}: ${p.value}`)
        .join(", ")
    : "";
  const searchText = `${specCard.boq_description ?? ""} ${paramText}`.trim();

  // Run fuzzy matching: top 5 matches
  const topMatches = fuzzyMatchRateCardItems(searchText, rciList, 5);

  // Build rate card matches context for the AI prompt
  const rateCardMatchesForPrompt = topMatches.map((m) => ({
    item_name: m.rci.item_name,
    category: m.rci.category,
    unit: m.rci.unit,
    unit_price: m.rci.unit_price,
    brand: m.rci.brand,
    model_sku: m.rci.model_sku,
    specifications: m.rci.specifications,
    match_confidence: Math.round(m.score * 100),
    rate_card_item_id: m.rci.id,
  }));

  // Build prompt
  const prompt = buildProductNominationPrompt(
    specCard as unknown as Record<string, unknown>,
    rateCardMatchesForPrompt
  );

  try {
    // Call AI
    const rawText = await callAIWithPrompt(prompt);
    const json = extractJSON(rawText);
    const parsed = nominationsResponseSchema.parse(JSON.parse(json));

    // Verify nominations
    const { verified } = verifyNominations(parsed.nominations, specCard as unknown as SpecCard);

    // Insert product_nomination rows
    const rows = verified.map((nom, idx) => {
      // Try to find matching rate card item if source is rate_card
      const matchedRci = nom.source === "rate_card"
        ? topMatches.find((m) =>
            m.rci.item_name.toLowerCase() === (nom.product_name || "").toLowerCase() ||
            (nom.brand && m.rci.brand && m.rci.brand.toLowerCase() === nom.brand.toLowerCase())
          )
        : null;

      return {
        spec_card_id: specCardId,
        tender_id: specCard.tender_id,
        user_id: user.id,
        product_name: nom.product_name,
        brand: nom.brand,
        model_sku: nom.model_sku,
        distributor: nom.distributor,
        unit_price: nom.estimated_price,
        currency: "SAR",
        source: nom.source,
        rate_card_item_id: matchedRci?.rci.id ?? null,
        source_url: nom.source_url,
        source_notes: null,
        compliance_score: nom.compliance_score,
        compliance_details: nom.compliance_details,
        is_selected: false,
        rank: nom.rank || idx + 1,
      };
    });

    if (rows.length > 0) {
      const { error: insertError } = await supabase
        .from("product_nominations")
        .insert(rows);

      if (insertError) {
        return { success: false, error: "فشل حفظ الترشيحات: " + insertError.message };
      }
    }

    // Fetch inserted rows to return
    const { data: insertedNoms } = await supabase
      .from("product_nominations")
      .select("*")
      .eq("spec_card_id", specCardId)
      .eq("user_id", user.id)
      .order("rank", { ascending: true });

    revalidatePath(`/tenders/${specCard.tender_id}`);
    return { success: true, nominations: (insertedNoms ?? []) as ProductNomination[] };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[nominateProducts] Error:", message);
    return {
      success: false,
      error: message.includes("مفتاح") ? message : "حدث خطأ أثناء ترشيح المنتجات: " + message,
    };
  }
}

// ---------------------------------------------------------------------------
// 2. nominateProductsBatch — nominate for all approved spec cards
// ---------------------------------------------------------------------------

export async function nominateProductsBatch(tenderId: string): Promise<NominateProductsBatchResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: "يجب تسجيل الدخول" };
  }

  // Fetch all approved spec cards for the tender
  const { data: specCards, error: scError } = await supabase
    .from("spec_cards")
    .select("id")
    .eq("tender_id", tenderId)
    .eq("user_id", user.id)
    .eq("status", "approved")
    .order("boq_seq", { ascending: true });

  if (scError) {
    return { success: false, error: scError.message };
  }

  if (!specCards || specCards.length === 0) {
    return { success: false, error: "لا توجد بطاقات مواصفات معتمدة. يرجى اعتماد البطاقات أولاً." };
  }

  // Update tender nominations_status to 'generating'
  await supabase
    .from("tenders")
    .update({ nominations_status: "generating", updated_at: new Date().toISOString() })
    .eq("id", tenderId)
    .eq("user_id", user.id);

  let totalNominations = 0;
  const errors: string[] = [];

  try {
    for (const sc of specCards) {
      const result = await nominateProducts(sc.id);
      if (result.success) {
        totalNominations += result.nominations.length;
      } else {
        errors.push(`بطاقة ${sc.id}: ${result.error}`);
      }
    }

    // Update tender nominations_status
    const finalStatus = errors.length === specCards.length ? "error" : "ready";
    await supabase
      .from("tenders")
      .update({ nominations_status: finalStatus, updated_at: new Date().toISOString() })
      .eq("id", tenderId)
      .eq("user_id", user.id);

    revalidatePath(`/tenders/${tenderId}`);
    revalidatePath("/tenders");

    if (errors.length > 0 && totalNominations === 0) {
      return { success: false, error: "فشل ترشيح المنتجات لجميع البطاقات: " + errors[0] };
    }

    return { success: true, totalNominations };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[nominateProductsBatch] Error:", message);

    await supabase
      .from("tenders")
      .update({ nominations_status: "error", updated_at: new Date().toISOString() })
      .eq("id", tenderId)
      .eq("user_id", user.id);

    return {
      success: false,
      error: message.includes("مفتاح") ? message : "حدث خطأ أثناء ترشيح المنتجات: " + message,
    };
  }
}

// ---------------------------------------------------------------------------
// 3. listNominations — fetch nominations for a spec card
// ---------------------------------------------------------------------------

export async function listNominations(specCardId: string): Promise<ListNominationsResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: "يجب تسجيل الدخول" };
  }

  const { data, error } = await supabase
    .from("product_nominations")
    .select("*")
    .eq("spec_card_id", specCardId)
    .eq("user_id", user.id)
    .order("rank", { ascending: true });

  if (error) return { success: false, error: error.message };
  return { success: true, nominations: (data ?? []) as ProductNomination[] };
}

// ---------------------------------------------------------------------------
// 4. listNominationsByTender — fetch all nominations for a tender
// ---------------------------------------------------------------------------

export async function listNominationsByTender(tenderId: string): Promise<ListNominationsResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: "يجب تسجيل الدخول" };
  }

  const { data, error } = await supabase
    .from("product_nominations")
    .select("*")
    .eq("tender_id", tenderId)
    .eq("user_id", user.id)
    .order("spec_card_id", { ascending: true })
    .order("rank", { ascending: true });

  if (error) return { success: false, error: error.message };
  return { success: true, nominations: (data ?? []) as ProductNomination[] };
}

// ---------------------------------------------------------------------------
// 5. selectNomination — select one nomination per spec card (radio-style)
// ---------------------------------------------------------------------------

export async function selectNomination(nominationId: string): Promise<SelectNominationResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: "يجب تسجيل الدخول" };
  }

  // Fetch the nomination to get spec_card_id
  const { data: nom, error: nomError } = await supabase
    .from("product_nominations")
    .select("spec_card_id, tender_id")
    .eq("id", nominationId)
    .eq("user_id", user.id)
    .single();

  if (nomError || !nom) {
    return { success: false, error: "الترشيح غير موجود" };
  }

  // Unselect all other nominations for the same spec card
  const { error: unselectError } = await supabase
    .from("product_nominations")
    .update({ is_selected: false, updated_at: new Date().toISOString() })
    .eq("spec_card_id", nom.spec_card_id)
    .eq("user_id", user.id);

  if (unselectError) return { success: false, error: unselectError.message };

  // Select this one
  const { error: selectError } = await supabase
    .from("product_nominations")
    .update({ is_selected: true, updated_at: new Date().toISOString() })
    .eq("id", nominationId)
    .eq("user_id", user.id);

  if (selectError) return { success: false, error: selectError.message };

  revalidatePath(`/tenders/${nom.tender_id}`);
  return { success: true };
}

// ---------------------------------------------------------------------------
// 6. addManualNomination — manually add a product nomination
// ---------------------------------------------------------------------------

export async function addManualNomination(input: {
  spec_card_id: string;
  tender_id: string;
  product_name: string;
  brand?: string;
  model_sku?: string;
  distributor?: string;
  unit_price?: number;
  source_notes?: string;
}): Promise<AddManualNominationResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: "يجب تسجيل الدخول" };
  }

  const productName = input.product_name?.trim();
  if (!productName) {
    return { success: false, error: "اسم المنتج مطلوب" };
  }

  // Get next rank for this spec card
  const { data: existing } = await supabase
    .from("product_nominations")
    .select("rank")
    .eq("spec_card_id", input.spec_card_id)
    .eq("user_id", user.id)
    .order("rank", { ascending: false })
    .limit(1);

  const nextRank = existing && existing.length > 0 ? (existing[0].rank ?? 0) + 1 : 1;

  const { data, error } = await supabase
    .from("product_nominations")
    .insert({
      spec_card_id: input.spec_card_id,
      tender_id: input.tender_id,
      user_id: user.id,
      product_name: productName,
      brand: input.brand?.trim() || null,
      model_sku: input.model_sku?.trim() || null,
      distributor: input.distributor?.trim() || null,
      unit_price: input.unit_price != null ? Number(input.unit_price) : null,
      currency: "SAR",
      source: "manual" as const,
      rate_card_item_id: null,
      source_url: null,
      source_notes: input.source_notes?.trim() || null,
      compliance_score: 100, // manual = assumed compliant
      compliance_details: [],
      is_selected: false,
      rank: nextRank,
    })
    .select("id")
    .single();

  if (error) return { success: false, error: error.message };
  revalidatePath(`/tenders/${input.tender_id}`);
  return { success: true, id: data.id };
}

// ---------------------------------------------------------------------------
// 7. updateNomination — edit product nomination fields
// ---------------------------------------------------------------------------

export async function updateNomination(input: {
  id: string;
  product_name: string;
  brand?: string;
  model_sku?: string;
  distributor?: string;
  unit_price?: number;
}): Promise<UpdateNominationResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: "يجب تسجيل الدخول" };
  }

  const productName = input.product_name?.trim();
  if (!productName) {
    return { success: false, error: "اسم المنتج مطلوب" };
  }

  // Fetch tender_id for revalidation
  const { data: nom } = await supabase
    .from("product_nominations")
    .select("tender_id")
    .eq("id", input.id)
    .eq("user_id", user.id)
    .single();

  if (!nom) {
    return { success: false, error: "الترشيح غير موجود" };
  }

  const { error } = await supabase
    .from("product_nominations")
    .update({
      product_name: productName,
      brand: input.brand?.trim() || null,
      model_sku: input.model_sku?.trim() || null,
      distributor: input.distributor?.trim() || null,
      unit_price: input.unit_price != null ? Number(input.unit_price) : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.id)
    .eq("user_id", user.id);

  if (error) return { success: false, error: error.message };
  revalidatePath(`/tenders/${nom.tender_id}`);
  return { success: true };
}

// ---------------------------------------------------------------------------
// 7b. selectAllBestNominations — select top-ranked nomination per spec card
// ---------------------------------------------------------------------------

export async function selectAllBestNominations(
  tenderId: string
): Promise<SelectAllBestResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: "يجب تسجيل الدخول" };
  }

  // Fetch all nominations for this tender
  const { data: noms, error: fetchError } = await supabase
    .from("product_nominations")
    .select("id, spec_card_id, rank")
    .eq("tender_id", tenderId)
    .eq("user_id", user.id)
    .order("rank", { ascending: true });

  if (fetchError) return { success: false, error: fetchError.message };
  if (!noms || noms.length === 0) {
    return { success: false, error: "لا توجد ترشيحات" };
  }

  // Find the best (lowest rank) nomination per spec card
  const bestPerCard = new Map<string, string>();
  for (const n of noms) {
    if (!bestPerCard.has(n.spec_card_id)) {
      bestPerCard.set(n.spec_card_id, n.id);
    }
  }

  // Unselect all nominations for this tender first
  const { error: unselectError } = await supabase
    .from("product_nominations")
    .update({ is_selected: false, updated_at: new Date().toISOString() })
    .eq("tender_id", tenderId)
    .eq("user_id", user.id);

  if (unselectError) return { success: false, error: unselectError.message };

  // Select the best ones
  const bestIds = Array.from(bestPerCard.values());
  const { error: selectError } = await supabase
    .from("product_nominations")
    .update({ is_selected: true, updated_at: new Date().toISOString() })
    .in("id", bestIds)
    .eq("user_id", user.id);

  if (selectError) return { success: false, error: selectError.message };

  revalidatePath(`/tenders/${tenderId}`);
  return { success: true, selectedCount: bestIds.length };
}

// ---------------------------------------------------------------------------
// 8. deleteNomination — delete a product nomination
// ---------------------------------------------------------------------------

export async function deleteNomination(id: string): Promise<DeleteNominationResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: "يجب تسجيل الدخول" };
  }

  // Fetch tender_id for revalidation
  const { data: nom } = await supabase
    .from("product_nominations")
    .select("tender_id")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  const { error } = await supabase
    .from("product_nominations")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { success: false, error: error.message };
  if (nom?.tender_id) revalidatePath(`/tenders/${nom.tender_id}`);
  return { success: true };
}

// ---------------------------------------------------------------------------
// 8. applyNominationsToCostItems — THE BRIDGE: selected nominations → cost items
// ---------------------------------------------------------------------------

export async function applyNominationsToCostItems(tenderId: string): Promise<ApplyNominationsResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: "يجب تسجيل الدخول" };
  }

  // Fetch all selected nominations for the tender, joined with spec_cards
  const { data: nominations, error: nomError } = await supabase
    .from("product_nominations")
    .select("*, spec_cards!inner(boq_seq, boq_description)")
    .eq("tender_id", tenderId)
    .eq("user_id", user.id)
    .eq("is_selected", true);

  if (nomError) return { success: false, error: nomError.message };

  if (!nominations || nominations.length === 0) {
    return { success: false, error: "لا توجد ترشيحات مختارة. يرجى اختيار منتج لكل بند أولاً." };
  }

  // Fetch the tender's BOQ items for quantity/unit
  const { data: tender, error: tenderError } = await supabase
    .from("tenders")
    .select("extracted_sections")
    .eq("id", tenderId)
    .eq("user_id", user.id)
    .single();

  if (tenderError || !tender) {
    return { success: false, error: "المنافسة غير موجودة" };
  }

  const sections = tender.extracted_sections as ExtractedSections | null;
  const boqItems = sections?.boq?.items ?? [];

  // Delete existing ai_suggested cost items for this tender (to avoid duplicates on re-apply)
  const { error: deleteError } = await supabase
    .from("cost_items")
    .delete()
    .eq("tender_id", tenderId)
    .eq("user_id", user.id)
    .eq("source", "ai_suggested");

  if (deleteError) {
    return { success: false, error: "فشل حذف بنود التكلفة السابقة: " + deleteError.message };
  }

  // For each selected nomination, create a cost_item
  const costItems = nominations.map((nom: Record<string, unknown>, idx: number) => {
    const specCardData = nom.spec_cards as { boq_seq: number; boq_description: string } | null;
    const boqSeq = specCardData?.boq_seq ?? 0;
    const boqDescription = specCardData?.boq_description ?? "بند غير مسمى";

    // Find the matching BOQ item for quantity and unit
    const boqItem = boqItems.find((b: BOQItem) => b.seq === boqSeq);

    // Determine source
    const nomSource = nom.source as string;
    let costSource: "rate_card" | "manual" | "ai_suggested" = "ai_suggested";
    if (nomSource === "rate_card") costSource = "rate_card";
    else if (nomSource === "manual") costSource = "manual";

    // Build source_notes from brand, model_sku, distributor
    const sourceNotes = [nom.brand, nom.model_sku, nom.distributor]
      .filter(Boolean)
      .join(" | ") || null;

    return {
      tender_id: tenderId,
      user_id: user.id,
      category: "direct" as const,
      description: boqDescription,
      quantity: boqItem?.quantity ?? 1,
      unit: boqItem?.unit ?? "وحدة",
      unit_price: (nom.unit_price as number) ?? 0,
      source: costSource,
      rate_card_item_id: (nom.rate_card_item_id as string) ?? null,
      source_notes: sourceNotes,
      sort_order: idx,
    };
  });

  if (costItems.length > 0) {
    const { error: insertError } = await supabase
      .from("cost_items")
      .insert(costItems);

    if (insertError) {
      return { success: false, error: "فشل إنشاء بنود التكلفة: " + insertError.message };
    }
  }

  revalidatePath(`/tenders/${tenderId}`);
  revalidatePath("/tenders");
  return { success: true, count: costItems.length };
}
