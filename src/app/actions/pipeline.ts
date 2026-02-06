"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type MoveResult =
  | { success: true }
  | { success: false; error: string };

export async function moveToPipeline(
  tenderId: string,
  stageId: string
): Promise<MoveResult> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: "يجب تسجيل الدخول" };
  }

  const { error } = await supabase.from("pipeline_entries").upsert(
    {
      tender_id: tenderId,
      stage_id: stageId,
      user_id: user.id,
      moved_at: new Date().toISOString(),
    },
    { onConflict: "tender_id" }
  );

  if (error) {
    return { success: false, error: "فشل نقل المنافسة: " + error.message };
  }

  revalidatePath("/pipeline");
  return { success: true };
}

export async function addTenderToPipeline(tenderId: string): Promise<MoveResult> {
  return moveToPipeline(tenderId, "new");
}

export type PushToCRMResult =
  | { success: true; payload: CRMExportPayload }
  | { success: false; error: string };

export interface CRMExportPayload {
  entity: string;
  title: string;
  number: string;
  deadline: string;
  value: number;
  score: number | null;
  recommendation: string | null;
}

export async function pushToCRM(tenderId: string): Promise<PushToCRMResult> {
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
    .select("entity, tender_title, tender_number, deadline, estimated_value, evaluation_score, recommendation")
    .eq("id", tenderId)
    .eq("user_id", user.id)
    .single();

  if (tenderError || !tender) {
    return { success: false, error: "المنافسة غير موجودة" };
  }

  const payload: CRMExportPayload = {
    entity: tender.entity,
    title: tender.tender_title,
    number: tender.tender_number,
    deadline: tender.deadline,
    value: Number(tender.estimated_value),
    score: tender.evaluation_score ?? null,
    recommendation: tender.recommendation,
  };

  revalidatePath("/pipeline");
  return { success: true, payload };
}
