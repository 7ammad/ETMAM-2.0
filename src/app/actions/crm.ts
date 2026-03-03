"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { updateOdooLead, createOdooLead } from "@/lib/odoo";
import type { EvaluationRecommendation } from "@/types/database";

/* ── Types ── */

export interface Opportunity {
  id: string;
  entity: string;
  tender_title: string;
  tender_number: string;
  deadline: string;
  estimated_value: number | null;
  evaluation_score: number | null;
  recommendation: string | null;
  auto_recommendation: EvaluationRecommendation | null;
  odoo_lead_id: number | null;
  pushed_to_odoo_at: string | null;
  status: string;
  description: string | null;
  proposed_price: number | null;
}

export interface OpportunityStats {
  total: number;
  totalValue: number;
  avgScore: number;
  thisMonth: number;
}

/* ── Get all opportunities ── */

export async function getOpportunities(): Promise<
  { success: true; opportunities: Opportunity[]; stats: OpportunityStats }
  | { success: false; error: string }
> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { success: false, error: "يجب تسجيل الدخول" };

  // Show all evaluated tenders as opportunities (not just pushed ones)
  const { data: tenders, error: tErr } = await supabase
    .from("tenders")
    .select("id, entity, tender_title, tender_number, deadline, estimated_value, evaluation_score, recommendation, odoo_lead_id, pushed_to_odoo_at, status, description, proposed_price")
    .eq("user_id", user.id)
    .not("evaluation_score", "is", null)
    .order("evaluation_score", { ascending: false });

  if (tErr) return { success: false, error: tErr.message };

  const opportunities = (tenders ?? []) as Opportunity[];

  // Fetch evaluations for auto_recommendation
  const ids = opportunities.map((o) => o.id);
  let evalMap = new Map<string, EvaluationRecommendation>();
  if (ids.length > 0) {
    const { data: evals } = await supabase
      .from("evaluations")
      .select("tender_id, auto_recommendation")
      .eq("user_id", user.id)
      .in("tender_id", ids);
    for (const e of evals ?? []) {
      evalMap.set(
        (e as { tender_id: string }).tender_id,
        (e as { auto_recommendation: EvaluationRecommendation }).auto_recommendation
      );
    }
  }

  // Merge auto_recommendation
  for (const opp of opportunities) {
    if (!opp.auto_recommendation) {
      opp.auto_recommendation = evalMap.get(opp.id) ?? null;
    }
  }

  // Stats
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const totalValue = opportunities.reduce((s, o) => s + (Number(o.estimated_value) || 0), 0);
  const scored = opportunities.filter((o) => o.evaluation_score != null);
  const avgScore = scored.length > 0
    ? scored.reduce((s, o) => s + (o.evaluation_score ?? 0), 0) / scored.length
    : 0;
  const pushed = opportunities.filter((o) => o.odoo_lead_id != null);
  const thisMonth = pushed.filter((o) => o.pushed_to_odoo_at != null && o.pushed_to_odoo_at >= monthStart).length;

  return {
    success: true,
    opportunities,
    stats: {
      total: opportunities.length,
      totalValue,
      avgScore,
      thisMonth,
    },
  };
}

/* ── Get single opportunity ── */

export async function getOpportunity(id: string): Promise<
  { success: true; opportunity: Opportunity; auto_recommendation: EvaluationRecommendation | null }
  | { success: false; error: string }
> {
  z.string().uuid().parse(id);

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { success: false, error: "يجب تسجيل الدخول" };

  const { data: tender, error: tErr } = await supabase
    .from("tenders")
    .select("id, entity, tender_title, tender_number, deadline, estimated_value, evaluation_score, recommendation, odoo_lead_id, pushed_to_odoo_at, status, description, proposed_price")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (tErr || !tender) return { success: false, error: "الفرصة غير موجودة" };

  const opp = tender as Opportunity;

  // Get evaluation
  const { data: evalData } = await supabase
    .from("evaluations")
    .select("auto_recommendation")
    .eq("tender_id", id)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const autoRec = (evalData as { auto_recommendation: EvaluationRecommendation } | null)?.auto_recommendation ?? null;

  return { success: true, opportunity: opp, auto_recommendation: autoRec };
}

/* ── Update opportunity locally ── */

const updateSchema = z.object({
  entity: z.string().min(1).optional(),
  tender_title: z.string().min(1).optional(),
  estimated_value: z.number().nonnegative().optional(),
  deadline: z.string().optional(),
  description: z.string().optional(),
});

export async function updateOpportunity(
  tenderId: string,
  data: z.infer<typeof updateSchema>
): Promise<{ success: true } | { success: false; error: string }> {
  z.string().uuid().parse(tenderId);
  const parsed = updateSchema.parse(data);

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { success: false, error: "يجب تسجيل الدخول" };

  const { error } = await supabase
    .from("tenders")
    .update({ ...parsed, updated_at: new Date().toISOString() })
    .eq("id", tenderId)
    .eq("user_id", user.id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/opportunities");
  revalidatePath(`/opportunities/${tenderId}`);
  revalidatePath("/tenders");
  return { success: true };
}

/* ── Re-push to Odoo ── */

export async function repushToOdoo(
  tenderId: string
): Promise<{ success: true } | { success: false; error: string }> {
  z.string().uuid().parse(tenderId);

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { success: false, error: "يجب تسجيل الدخول" };

  const url = process.env.ODOO_URL?.trim();
  const db = process.env.ODOO_DB?.trim();
  const username = process.env.ODOO_USERNAME?.trim();
  const api_key = process.env.ODOO_API_KEY?.trim();
  if (!url || !db || !username || !api_key) {
    return { success: false, error: "لم يتم إعداد Odoo" };
  }

  const { data: tender, error: tErr } = await supabase
    .from("tenders")
    .select("id, entity, tender_title, tender_number, deadline, estimated_value, evaluation_score, recommendation, proposed_price, odoo_lead_id")
    .eq("id", tenderId)
    .eq("user_id", user.id)
    .single();

  if (tErr || !tender) return { success: false, error: "الفرصة غير موجودة" };

  const value = Number(tender.estimated_value) || 0;
  const description = `رقم المنافسة: ${tender.tender_number}\nالجهة: ${tender.entity}\nالتوصية: ${tender.recommendation ?? ""}\nسعر العرض: ${tender.proposed_price ?? ""}`;

  if (tender.odoo_lead_id) {
    // Update existing lead
    const result = await updateOdooLead(
      { url, db, username, api_key },
      tender.odoo_lead_id,
      {
        name: tender.tender_title,
        expected_revenue: value,
        date_deadline: tender.deadline || undefined,
        description,
        partner_name: tender.entity,
      }
    );
    if (!result.success) return { success: false, error: result.error ?? "تعذر التحديث" };
  } else {
    // Create new lead
    const result = await createOdooLead(
      { url, db, username, api_key },
      {
        name: tender.tender_title,
        expected_revenue: value,
        date_deadline: tender.deadline || undefined,
        description,
        partner_name: tender.entity,
      }
    );
    if (!result.success) return { success: false, error: result.error ?? "تعذر الإنشاء" };
    if (result.lead_id) {
      await supabase
        .from("tenders")
        .update({ odoo_lead_id: result.lead_id })
        .eq("id", tenderId)
        .eq("user_id", user.id);
    }
  }

  await supabase
    .from("tenders")
    .update({ pushed_to_odoo_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", tenderId)
    .eq("user_id", user.id);

  revalidatePath("/opportunities");
  revalidatePath(`/opportunities/${tenderId}`);
  revalidatePath("/dashboard");
  return { success: true };
}

/* ── Batch re-push ── */

export async function batchRepush(
  ids: string[]
): Promise<{ success: true; results: { id: string; ok: boolean; error?: string }[] } | { success: false; error: string }> {
  z.array(z.string().uuid()).min(1).parse(ids);

  const results: { id: string; ok: boolean; error?: string }[] = [];
  for (const id of ids) {
    const r = await repushToOdoo(id);
    results.push({ id, ok: r.success, error: r.success ? undefined : r.error });
  }

  revalidatePath("/opportunities");
  return { success: true, results };
}
