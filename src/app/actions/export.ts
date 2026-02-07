"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import * as XLSX from "xlsx";
import { createOdooLead } from "@/lib/odoo";
import type { Tender } from "@/types/database";
import type { Evaluation } from "@/types/database";
import type { CostItem } from "@/types/database";

export type ExportExcelResult =
  | { success: true; base64: string; filename: string }
  | { success: false; error: string };

/**
 * Build 3-sheet Excel (PRD 6A): Tender Overview, Evaluation Details, Cost Breakdown.
 * Returns base64 and filename for client download.
 */
export async function exportTenderToExcel(tenderId: string): Promise<ExportExcelResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: "يجب تسجيل الدخول" };
  }

  const { data: tender, error: tenderError } = await supabase
    .from("tenders")
    .select("*")
    .eq("id", tenderId)
    .eq("user_id", user.id)
    .single();

  if (tenderError || !tender) {
    return { success: false, error: "المنافسة غير موجودة" };
  }

  const { data: evaluation } = await supabase
    .from("evaluations")
    .select("*")
    .eq("tender_id", tenderId)
    .eq("user_id", user.id)
    .maybeSingle();

  const { data: costItems } = await supabase
    .from("cost_items")
    .select("*")
    .eq("tender_id", tenderId)
    .eq("user_id", user.id)
    .order("sort_order", { ascending: true });

  const tenderRow = tender as Tender;
  const evalRow = evaluation as Evaluation | null;
  const items = (costItems ?? []) as CostItem[];

  const wb = XLSX.utils.book_new();

  // Sheet 1 — بيانات المنافسة (Tender Overview)
  const overviewData = [
    ["الجهة", tenderRow.entity],
    ["عنوان المنافسة", tenderRow.tender_title],
    ["رقم المنافسة", tenderRow.tender_number],
    ["الموعد النهائي", tenderRow.deadline],
    ["قيمة تقديرية", tenderRow.estimated_value ?? ""],
    ["درجة التقييم", tenderRow.evaluation_score ?? evalRow?.overall_score ?? ""],
    ["التوصية", tenderRow.recommendation ?? evalRow?.auto_recommendation ?? ""],
    ["سعر العرض", tenderRow.proposed_price ?? ""],
  ];
  const ws1 = XLSX.utils.aoa_to_sheet(overviewData);
  XLSX.utils.book_append_sheet(wb, ws1, "بيانات المنافسة");

  // Sheet 2 — التقييم (Evaluation Details)
  const criteria = evalRow?.criteria_scores as Record<string, { score?: number; reasoning?: string }> | null;
  const evalRows = criteria
    ? Object.entries(criteria).map(([name, v]) => [
        name,
        typeof v === "object" && v && "score" in v ? (v as { score?: number }).score : "",
        typeof v === "object" && v && "reasoning" in v ? (v as { reasoning?: string }).reasoning : "",
      ])
    : [["المعيار", "الدرجة", "ملاحظات"]];
  if (evalRows.length === 0 || (evalRows.length === 1 && evalRows[0][0] === "المعيار")) {
    evalRows.push(["—", "—", "لا توجد بيانات تقييم"]);
  }
  const ws2 = XLSX.utils.aoa_to_sheet(evalRows);
  XLSX.utils.book_append_sheet(wb, ws2, "التقييم");

  // Sheet 3 — التكاليف (Cost Breakdown)
  const costHeaders = ["التصنيف", "الوصف", "الكمية", "الوحدة", "السعر", "الإجمالي", "المصدر"];
  const costRows = items.map((i) => [
    i.category,
    i.description,
    i.quantity,
    i.unit,
    i.unit_price,
    i.total,
    i.source,
  ]);
  const ws3 = XLSX.utils.aoa_to_sheet([costHeaders, ...costRows]);
  XLSX.utils.book_append_sheet(wb, ws3, "التكاليف");

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  const base64 = Buffer.from(buf).toString("base64");
  const date = new Date().toISOString().slice(0, 10);
  const filename = `Etmam_${tenderRow.tender_number}_${date}.xlsx`;

  return { success: true, base64, filename };
}

/** Qualified = evaluation_score >= 70 (PRD: Push All Qualified). */
const QUALIFIED_SCORE_THRESHOLD = 70;

/**
 * Export multiple tenders to one Excel file (Phase 2.3 batch). Same 3-sheet format, Arabic headers.
 * Sheet 1: overview (one row per tender). Sheet 2: evaluation (one row per tender). Sheet 3: cost items (all items, first col = tender number).
 */
export async function exportTendersToExcel(
  tenderIds: string[]
): Promise<ExportExcelResult> {
  if (tenderIds.length === 0) {
    return { success: false, error: "لم يتم اختيار أي منافسات" };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: "يجب تسجيل الدخول" };
  }

  const { data: tenders, error: tendersError } = await supabase
    .from("tenders")
    .select("*")
    .eq("user_id", user.id)
    .in("id", tenderIds);

  if (tendersError || !tenders?.length) {
    return { success: false, error: "لم يتم العثور على المنافسات" };
  }

  const { data: evaluations } = await supabase
    .from("evaluations")
    .select("*")
    .eq("user_id", user.id)
    .in("tender_id", tenderIds);

  const { data: costItems } = await supabase
    .from("cost_items")
    .select("*")
    .eq("user_id", user.id)
    .in("tender_id", tenderIds)
    .order("tender_id")
    .order("sort_order", { ascending: true });

  const evalByTender = new Map<string, Evaluation>();
  for (const e of evaluations ?? []) {
    evalByTender.set((e as Evaluation).tender_id, e as Evaluation);
  }
  const itemsByTender = new Map<string, CostItem[]>();
  for (const i of costItems ?? []) {
    const c = i as CostItem;
    const list = itemsByTender.get(c.tender_id) ?? [];
    list.push(c);
    itemsByTender.set(c.tender_id, list);
  }

  const wb = XLSX.utils.book_new();

  // Sheet 1 — بيانات المنافسة (one row per tender)
  const overviewHeaders = [
    "الجهة",
    "عنوان المنافسة",
    "رقم المنافسة",
    "الموعد النهائي",
    "قيمة تقديرية",
    "درجة التقييم",
    "التوصية",
    "سعر العرض",
  ];
  const overviewRows = (tenders as Tender[]).map((t) => {
    const e = evalByTender.get(t.id);
    return [
      t.entity,
      t.tender_title,
      t.tender_number,
      t.deadline,
      t.estimated_value ?? "",
      t.evaluation_score ?? e?.overall_score ?? "",
      t.recommendation ?? e?.auto_recommendation ?? "",
      t.proposed_price ?? "",
    ];
  });
  const ws1 = XLSX.utils.aoa_to_sheet([overviewHeaders, ...overviewRows]);
  XLSX.utils.book_append_sheet(wb, ws1, "بيانات المنافسة");

  // Sheet 2 — التقييم (one row per tender: رقم المنافسة, الدرجة, التوصية)
  const evalHeaders = ["رقم المنافسة", "الدرجة الكلية", "التوصية"];
  const evalRows = (tenders as Tender[]).map((t) => {
    const e = evalByTender.get(t.id);
    return [
      t.tender_number,
      t.evaluation_score ?? e?.overall_score ?? "",
      t.recommendation ?? e?.auto_recommendation ?? "",
    ];
  });
  const ws2 = XLSX.utils.aoa_to_sheet([evalHeaders, ...evalRows]);
  XLSX.utils.book_append_sheet(wb, ws2, "التقييم");

  // Sheet 3 — التكاليف (all items; first column = tender number)
  const costHeaders = [
    "رقم المنافسة",
    "التصنيف",
    "الوصف",
    "الكمية",
    "الوحدة",
    "السعر",
    "الإجمالي",
    "المصدر",
  ];
  const costRows: unknown[][] = [];
  for (const t of tenders as Tender[]) {
    const items = itemsByTender.get(t.id) ?? [];
    for (const i of items) {
      costRows.push([
        t.tender_number,
        i.category,
        i.description,
        i.quantity,
        i.unit,
        i.unit_price,
        i.total,
        i.source,
      ]);
    }
  }
  const ws3 = XLSX.utils.aoa_to_sheet([costHeaders, ...costRows]);
  XLSX.utils.book_append_sheet(wb, ws3, "التكاليف");

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  const base64 = Buffer.from(buf).toString("base64");
  const date = new Date().toISOString().slice(0, 10);
  const filename = `Etmam_Export_${date}.xlsx`;

  return { success: true, base64, filename };
}

/**
 * Get all tender IDs for the current user (for Export All).
 */
export async function getAllTenderIds(): Promise<
  { success: true; ids: string[] } | { success: false; error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: "يجب تسجيل الدخول" };
  }
  const { data, error } = await supabase
    .from("tenders")
    .select("id")
    .eq("user_id", user.id);
  if (error) return { success: false, error: error.message };
  const ids = (data ?? []).map((r) => (r as { id: string }).id);
  return { success: true, ids };
}

export type PushAllQualifiedResult =
  | { success: true; successCount: number; failedCount: number; results: { tenderId: string; success: boolean; error?: string }[] }
  | { success: false; error: string };

/**
 * Push all qualified tenders (evaluation_score >= 70, not already pushed) to Odoo. Phase 2.3 batch.
 */
export async function pushQualifiedTendersToOdoo(): Promise<PushAllQualifiedResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: "يجب تسجيل الدخول" };
  }

  const url = process.env.ODOO_URL?.trim();
  const db = process.env.ODOO_DB?.trim();
  const username = process.env.ODOO_USERNAME?.trim();
  const api_key = process.env.ODOO_API_KEY?.trim();
  if (!url || !db || !username || !api_key) {
    return { success: false, error: "لم يتم إعداد Odoo. إعداد الاتصال من الإعدادات → ربط Odoo/CRM." };
  }

  const { data: qualified, error: fetchError } = await supabase
    .from("tenders")
    .select("id")
    .eq("user_id", user.id)
    .gte("evaluation_score", QUALIFIED_SCORE_THRESHOLD)
    .is("odoo_lead_id", null);

  if (fetchError) return { success: false, error: fetchError.message };
  const ids = (qualified ?? []).map((r) => (r as { id: string }).id);
  if (ids.length === 0) {
    return {
      success: true,
      successCount: 0,
      failedCount: 0,
      results: [],
    };
  }

  const results: { tenderId: string; success: boolean; error?: string }[] = [];
  for (const tenderId of ids) {
    const r = await pushTenderToOdoo(tenderId);
    if (r.success) {
      results.push({ tenderId, success: true });
    } else {
      results.push({ tenderId, success: false, error: r.error });
    }
  }

  const successCount = results.filter((x) => x.success).length;
  const failedCount = results.length - successCount;
  revalidatePath("/tenders");
  revalidatePath("/dashboard");
  return {
    success: true,
    successCount,
    failedCount,
    results,
  };
}

export type PushToOdooResult =
  | { success: true; odoo_lead_id: number }
  | { success: false; error: string };

/**
 * Push single tender to Odoo as crm.lead (PRD 6B). Uses ODOO_* env. Updates tender.odoo_lead_id on success.
 */
export async function pushTenderToOdoo(tenderId: string): Promise<PushToOdooResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: "يجب تسجيل الدخول" };
  }

  const url = process.env.ODOO_URL?.trim();
  const db = process.env.ODOO_DB?.trim();
  const username = process.env.ODOO_USERNAME?.trim();
  const api_key = process.env.ODOO_API_KEY?.trim();
  if (!url || !db || !username || !api_key) {
    return { success: false, error: "لم يتم إعداد Odoo. إعداد الاتصال من الإعدادات → ربط Odoo/CRM." };
  }

  const { data: tender, error: tenderError } = await supabase
    .from("tenders")
    .select("id, entity, tender_title, tender_number, deadline, estimated_value, evaluation_score, recommendation, proposed_price")
    .eq("id", tenderId)
    .eq("user_id", user.id)
    .single();

  if (tenderError || !tender) {
    return { success: false, error: "المنافسة غير موجودة" };
  }

  const value = Number(tender.estimated_value) || 0;
  const result = await createOdooLead(
    { url, db, username, api_key },
    {
      name: tender.tender_title,
      expected_revenue: value,
      date_deadline: tender.deadline || undefined,
      description: `رقم المنافسة: ${tender.tender_number}\nالجهة: ${tender.entity}\nالتوصية: ${tender.recommendation ?? ""}\nسعر العرض: ${tender.proposed_price ?? ""}`,
      partner_name: tender.entity,
    }
  );

  if (!result.success) {
    return { success: false, error: result.error ?? "تعذر الاتصال بـ Odoo" };
  }

  if (result.lead_id != null) {
    await supabase
      .from("tenders")
      .update({
        odoo_lead_id: result.lead_id,
        exported_at: new Date().toISOString(),
        exported_to: "odoo",
        updated_at: new Date().toISOString(),
      })
      .eq("id", tenderId)
      .eq("user_id", user.id);
    revalidatePath(`/tenders/${tenderId}`);
  }

  return { success: true, odoo_lead_id: result.lead_id ?? 0 };
}
