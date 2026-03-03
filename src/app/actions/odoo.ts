"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { testOdooConnection as testConnection } from "@/lib/odoo";

export interface OdooConfigStatus {
  url: string;
  db: string;
  username: string;
  hasApiKey: boolean;
}

export type GetOdooConfigResult =
  | { success: true; config: OdooConfigStatus }
  | { success: false; error: string };

/**
 * Get Odoo config from environment (PRD: .env ODOO_*).
 * Does not send API key to client; only hasApiKey boolean.
 */
export async function getOdooConfig(): Promise<GetOdooConfigResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "يجب تسجيل الدخول" };
  }

  const url = process.env.ODOO_URL ?? "";
  const db = process.env.ODOO_DB ?? "";
  const username = process.env.ODOO_USERNAME ?? "";
  const hasApiKey = Boolean(process.env.ODOO_API_KEY?.trim());

  return {
    success: true,
    config: { url, db, username, hasApiKey },
  };
}

export type TestOdooConnectionResult =
  | { success: true; connected: boolean; error?: string; database_name?: string }
  | { success: false; error: string };

/**
 * Test Odoo connection with provided credentials (or from env if not provided).
 * Uses XML-RPC authenticate. Arabic error messages per BACKEND.md.
 */
export async function testOdooConnection(params: {
  url?: string;
  db?: string;
  username?: string;
  api_key?: string;
}): Promise<TestOdooConnectionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "يجب تسجيل الدخول" };
  }

  const testOdooConnectionSchema = z.object({
    url: z.string().optional(),
    db: z.string().optional(),
    username: z.string().optional(),
    api_key: z.string().optional(),
  });
  testOdooConnectionSchema.parse(params);

  const url = (params.url?.trim() || (process.env.ODOO_URL ?? "")).replace(/\/$/, "");
  const db = params.db?.trim() || (process.env.ODOO_DB ?? "");
  const username = params.username?.trim() || (process.env.ODOO_USERNAME ?? "");
  const api_key = params.api_key?.trim() || (process.env.ODOO_API_KEY ?? "");

  if (!url || !db || !username || !api_key) {
    return {
      success: false,
      error: "أدخل الرابط، قاعدة البيانات، اسم المستخدم، ومفتاح API",
    };
  }

  try {
    const result = await testConnection({ url, db, username, api_key });

    if (!result.success) {
      return { success: false, error: result.error ?? "تعذر الاتصال بـ Odoo" };
    }

    return {
      success: true,
      connected: result.connected,
      error: result.connected ? undefined : result.error,
      database_name: result.database_name,
    };
  } catch {
    return { success: false, error: "تعذر الاتصال بـ Odoo — تحقق من الرابط والبيانات" };
  }
}

export async function pushTenderToOdoo(
  tenderId: string,
  evaluationId: string
): Promise<{ success: boolean; opportunityId?: string; error?: string }> {
  try {
    const supabase = await createClient();

    // 1. Fetch Tender and Evaluation records
    const { data: tender } = await supabase
      .from("tenders")
      .select("*")
      .eq("id", tenderId)
      .single();

    const { data: evaluation } = await supabase
      .from("evaluations")
      .select("*")
      .eq("id", evaluationId)
      .single();

    if (!tender || !evaluation) {
      return { success: false, error: "المنافسة أو التقييم غير موجود" };
    }

    // Extracted Evaluation Data
    const estimation = evaluation.criteria_scores?.parametric_estimate;

    const odooPayload = {
      name: `[${tender.tender_number}] ${tender.tender_title}`,
      partner_name: tender.entity,
      expected_revenue: estimation?.estimated_max_value ?? tender.estimated_value ?? 0,
      probability: evaluation.overall_score,
      description: `
        الوصف: ${tender.description || "لا يوجد"}
        الموعد النهائي: ${tender.deadline}

        التوصية الآلية: ${evaluation.auto_recommendation}
        التقييم: ${evaluation.overall_score}

        التقدير المالي (Parametric Range): ${estimation?.estimated_min_value ?? "N/A"} - ${estimation?.estimated_max_value ?? "N/A"} ر.س
        التبرير المالي: ${estimation?.estimation_rationale ?? "N/A"}
      `.trim()
    };

    console.log("[Odoo Integration] Pushing Payload:", odooPayload);

    // TODO: Replace with actual XML-RPC push when credentials are standard
    // Simulate API delay for now
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Update tender status
    await supabase
      .from("tenders")
      .update({ status: "exported" })
      .eq("id", tenderId);

    return {
      success: true,
      opportunityId: `ODOO-MOCK-${Math.floor(Math.random() * 10000)}`
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[Odoo Integration] Failed to push:", msg);
    return { success: false, error: msg };
  }
}
