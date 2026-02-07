"use server";

import { createClient } from "@/lib/supabase/server";
import { getAIProvider } from "@/lib/ai/provider";
import { buildSpecConstructionPrompt } from "@/lib/ai/prompts";
import { extractJSON, specCardsResponseSchema } from "@/lib/ai/parser";
import { verifySpecCards } from "@/lib/ai/verification";
import { revalidatePath } from "next/cache";
import type { SpecCard } from "@/types/spec-cards";
import type { BOQItem, ExtractedSections } from "@/types/extracted-sections";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type BuildSpecCardsResult =
  | { success: true; count: number }
  | { success: false; error: string };

export type ListSpecCardsResult =
  | { success: true; cards: SpecCard[] }
  | { success: false; error: string };

export type UpdateSpecCardResult =
  | { success: true }
  | { success: false; error: string };

export type ApproveRejectResult =
  | { success: true }
  | { success: false; error: string };

export type ApproveAllResult =
  | { success: true; count: number }
  | { success: false; error: string };

export type DeleteSpecCardsResult =
  | { success: true }
  | { success: false; error: string };

// ---------------------------------------------------------------------------
// 1. buildSpecCards — AI-generate spec cards from extracted BOQ + tech specs
// ---------------------------------------------------------------------------

export async function buildSpecCards(tenderId: string): Promise<BuildSpecCardsResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: "يجب تسجيل الدخول" };
  }

  // Fetch tender with extracted_sections
  const { data: tender, error: tenderError } = await supabase
    .from("tenders")
    .select("*")
    .eq("id", tenderId)
    .eq("user_id", user.id)
    .single();

  if (tenderError || !tender) {
    return { success: false, error: "المنافسة غير موجودة أو لا يمكنك الوصول إليها" };
  }

  // Validate extracted_sections has boq.items and technical_specs
  const sections = tender.extracted_sections as ExtractedSections | null;
  const boqItems = sections?.boq?.items ?? [];
  const technicalSpecs = sections?.technical_specs ?? null;

  if (boqItems.length === 0) {
    return { success: false, error: "لا توجد بنود في جدول الكميات. يجب استخراج البنود أولاً من ملف PDF" };
  }
  if (!technicalSpecs) {
    return { success: false, error: "لا توجد مواصفات فنية مستخرجة. يجب استخراج المواصفات أولاً من ملف PDF" };
  }

  // Update status to 'generating'
  await supabase
    .from("tenders")
    .update({ spec_cards_status: "generating", updated_at: new Date().toISOString() })
    .eq("id", tenderId)
    .eq("user_id", user.id);

  try {
    // Build the spec construction prompt
    const prompt = buildSpecConstructionPrompt(
      technicalSpecs as unknown as Record<string, unknown>,
      boqItems.map((item: BOQItem) => ({
        seq: item.seq,
        description: item.description,
        specifications: item.specifications,
        category: item.category,
      }))
    );

    // Call AI directly (bypasses analyze() which wraps with analysis template)
    const provider = await getAIProvider();
    const rawText = await callAIWithPrompt(prompt, provider.modelName);

    // Parse response
    const json = extractJSON(rawText);
    const parsed = specCardsResponseSchema.parse(JSON.parse(json));

    // Verify spec cards
    const { verified } = verifySpecCards(parsed.spec_cards, boqItems);

    // Insert spec_cards rows
    const rows = verified.map((card) => {
      // Find the matching BOQ item for boq_description
      const boqItem = boqItems.find((b: BOQItem) => b.seq === card.boq_seq);
      return {
        tender_id: tenderId,
        user_id: user.id,
        boq_seq: card.boq_seq,
        boq_description: boqItem?.description ?? `بند ${card.boq_seq}`,
        category: card.category,
        parameters: card.parameters,
        referenced_standards: card.referenced_standards,
        approved_brands: card.approved_brands,
        constraints: card.constraints,
        notes: card.notes,
        status: "draft" as const,
        ai_confidence: card.confidence,
        model_used: provider.modelName,
        user_edited: false,
      };
    });

    if (rows.length > 0) {
      // Clear existing spec cards for this tender before inserting new ones
      await supabase
        .from("spec_cards")
        .delete()
        .eq("tender_id", tenderId)
        .eq("user_id", user.id);

      const { error: insertError } = await supabase
        .from("spec_cards")
        .insert(rows);

      if (insertError) {
        await supabase
          .from("tenders")
          .update({ spec_cards_status: "error", updated_at: new Date().toISOString() })
          .eq("id", tenderId)
          .eq("user_id", user.id);
        return { success: false, error: "فشل حفظ بطاقات المواصفات: " + insertError.message };
      }
    }

    // Update tender status to 'ready'
    await supabase
      .from("tenders")
      .update({ spec_cards_status: "ready", updated_at: new Date().toISOString() })
      .eq("id", tenderId)
      .eq("user_id", user.id);

    revalidatePath(`/tenders/${tenderId}`);
    revalidatePath("/tenders");
    return { success: true, count: rows.length };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[buildSpecCards] Error:", message);

    // Update tender status to 'error'
    await supabase
      .from("tenders")
      .update({ spec_cards_status: "error", updated_at: new Date().toISOString() })
      .eq("id", tenderId)
      .eq("user_id", user.id);

    return {
      success: false,
      error: message.includes("مفتاح") ? message : "حدث خطأ أثناء بناء بطاقات المواصفات: " + message,
    };
  }
}

// ---------------------------------------------------------------------------
// Helper: Direct AI call with custom prompt (bypasses analyze() wrapper)
// ---------------------------------------------------------------------------

async function callAIWithPrompt(prompt: string, modelName: string): Promise<string> {
  // Try DeepSeek first
  const deepseekKey = process.env.DEEPSEEK_API_KEY?.trim();
  if (deepseekKey && (modelName.includes("deepseek") || !process.env.GEMINI_API_KEY)) {
    const res = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${deepseekKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: "أنت مهندس مواصفات فنية متخصص. أجب بـ JSON فقط." },
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
          { role: "system", content: "أنت مهندس مواصفات فنية متخصص. أجب بـ JSON فقط." },
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
      spec_cards: [],
      warnings: ["وضع المحاكاة — لا يوجد مزود ذكاء اصطناعي متاح"],
    });
  }

  throw new Error("لا يوجد مزود ذكاء اصطناعي متاح. يرجى إعداد مفتاح API.");
}

// ---------------------------------------------------------------------------
// 2. listSpecCards — fetch all spec cards for a tender
// ---------------------------------------------------------------------------

export async function listSpecCards(tenderId: string): Promise<ListSpecCardsResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: "يجب تسجيل الدخول" };
  }

  const { data, error } = await supabase
    .from("spec_cards")
    .select("*")
    .eq("tender_id", tenderId)
    .eq("user_id", user.id)
    .order("boq_seq", { ascending: true });

  if (error) return { success: false, error: error.message };
  return { success: true, cards: (data ?? []) as SpecCard[] };
}

// ---------------------------------------------------------------------------
// 3. updateSpecCard — manually edit a spec card
// ---------------------------------------------------------------------------

export async function updateSpecCard(
  id: string,
  updates: {
    category?: string;
    parameters?: unknown;
    referenced_standards?: string[];
    approved_brands?: string[];
    constraints?: string[];
    notes?: string;
  }
): Promise<UpdateSpecCardResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: "يجب تسجيل الدخول" };
  }

  const payload: Record<string, unknown> = {
    user_edited: true,
    updated_at: new Date().toISOString(),
  };
  if (updates.category !== undefined) payload.category = updates.category;
  if (updates.parameters !== undefined) payload.parameters = updates.parameters;
  if (updates.referenced_standards !== undefined) payload.referenced_standards = updates.referenced_standards;
  if (updates.approved_brands !== undefined) payload.approved_brands = updates.approved_brands;
  if (updates.constraints !== undefined) payload.constraints = updates.constraints;
  if (updates.notes !== undefined) payload.notes = updates.notes;

  const { data: row, error } = await supabase
    .from("spec_cards")
    .update(payload)
    .eq("id", id)
    .eq("user_id", user.id)
    .select("tender_id")
    .single();

  if (error) return { success: false, error: error.message };
  if (row?.tender_id) revalidatePath(`/tenders/${row.tender_id}`);
  return { success: true };
}

// ---------------------------------------------------------------------------
// 4. approveSpecCard — set status to 'approved'
// ---------------------------------------------------------------------------

export async function approveSpecCard(id: string): Promise<ApproveRejectResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: "يجب تسجيل الدخول" };
  }

  const { data: row, error } = await supabase
    .from("spec_cards")
    .update({ status: "approved", updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id)
    .select("tender_id")
    .single();

  if (error) return { success: false, error: error.message };
  if (row?.tender_id) revalidatePath(`/tenders/${row.tender_id}`);
  return { success: true };
}

// ---------------------------------------------------------------------------
// 5. rejectSpecCard — set status to 'rejected'
// ---------------------------------------------------------------------------

export async function rejectSpecCard(id: string): Promise<ApproveRejectResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: "يجب تسجيل الدخول" };
  }

  const { data: row, error } = await supabase
    .from("spec_cards")
    .update({ status: "rejected", updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id)
    .select("tender_id")
    .single();

  if (error) return { success: false, error: error.message };
  if (row?.tender_id) revalidatePath(`/tenders/${row.tender_id}`);
  return { success: true };
}

// ---------------------------------------------------------------------------
// 6. approveAllSpecCards — approve all draft spec cards for a tender
// ---------------------------------------------------------------------------

export async function approveAllSpecCards(tenderId: string): Promise<ApproveAllResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: "يجب تسجيل الدخول" };
  }

  const { data, error } = await supabase
    .from("spec_cards")
    .update({ status: "approved", updated_at: new Date().toISOString() })
    .eq("tender_id", tenderId)
    .eq("user_id", user.id)
    .eq("status", "draft")
    .select("id");

  if (error) return { success: false, error: error.message };
  revalidatePath(`/tenders/${tenderId}`);
  return { success: true, count: data?.length ?? 0 };
}

// ---------------------------------------------------------------------------
// 7. deleteSpecCards — delete all spec cards for a tender, reset status
// ---------------------------------------------------------------------------

export async function deleteSpecCards(tenderId: string): Promise<DeleteSpecCardsResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: "يجب تسجيل الدخول" };
  }

  const { error: deleteError } = await supabase
    .from("spec_cards")
    .delete()
    .eq("tender_id", tenderId)
    .eq("user_id", user.id);

  if (deleteError) return { success: false, error: deleteError.message };

  // Reset tender status
  await supabase
    .from("tenders")
    .update({ spec_cards_status: "pending", updated_at: new Date().toISOString() })
    .eq("id", tenderId)
    .eq("user_id", user.id);

  revalidatePath(`/tenders/${tenderId}`);
  revalidatePath("/tenders");
  return { success: true };
}
