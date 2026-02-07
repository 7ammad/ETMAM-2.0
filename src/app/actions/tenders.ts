"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const COLUMN_LABELS: Record<string, string> = {
  entity: "الجهة",
  tender_title: "عنوان المنافسة",
  tender_number: "رقم المنافسة",
  deadline: "الموعد النهائي",
  estimated_value: "القيمة التقديرية",
  description: "الوصف",
};

/** Normalize date string to YYYY-MM-DD for DB DATE column. Accepts ISO, DD/MM/YYYY, DD-MM-YYYY. */
function normalizeDeadline(val: string): string | null {
  const trimmed = val.trim();
  if (!trimmed) return null;
  // ISO or parseable by Date (e.g. YYYY-MM-DD)
  const date = new Date(trimmed);
  if (!Number.isNaN(date.getTime())) {
    return date.toISOString().split("T")[0];
  }
  // DD/MM/YYYY or DD-MM-YYYY
  const parts = trimmed.split(/[/-]/);
  if (parts.length === 3) {
    const [d, m, y] = parts.map((p) => p.trim());
    const year = y.length === 4 ? y : y.length === 2 ? `20${y}` : "";
    const month = m.padStart(2, "0");
    const day = d.padStart(2, "0");
    if (year && month && day) {
      const iso = `${year}-${month}-${day}`;
      const check = new Date(iso);
      if (!Number.isNaN(check.getTime())) return iso;
    }
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
  estimated_value: z.number().nonnegative("القيمة يجب أن تكون غير سالبة").optional().nullable(),
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
  estimated_value: number | null;
  description: string | null;
  requirements: string[];
  line_items: {
    description: string;
    quantity: number | null;
    unit: string | null;
    confidence: number;
  }[];
  extracted_sections?: Record<string, unknown> | null;
  extraction_confidence?: number;
  extraction_warnings: string[];
  source_file_name: string;
}): Promise<SavePdfTenderResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    console.error("[savePdfTender] Auth failed:", authError?.message ?? "no user");
    return { success: false, error: "يجب تسجيل الدخول" };
  }

  const deadline = normalizeDeadline(input.deadline);
  if (!deadline) {
    return { success: false, error: "صيغة التاريخ غير صحيحة. استخدم YYYY-MM-DD أو DD/MM/YYYY" };
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
  if (input.estimated_value != null) {
    if (input.estimated_value <= 0) {
      return { success: false, error: "القيمة التقديرية يجب أن تكون موجبة" };
    }
    if (input.estimated_value > 10_000_000_000) {
      return {
        success: false,
        error: "القيمة التقديرية مرتفعة بشكل غير معقول — يرجى التحقق",
      };
    }
  }

  // Derive flat line_items from extracted_sections.boq.items (single source of truth)
  const sections = input.extracted_sections as Record<string, unknown> | null | undefined;
  const boq = sections?.boq as { items?: { seq: number; description: string; quantity: number | null; unit: string | null; confidence: number; category?: string | null; specifications?: string | null }[] } | null | undefined;
  const boqItems = boq?.items ?? [];
  const derivedLineItems = boqItems.length > 0
    ? boqItems.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        confidence: item.confidence ?? 50,
      }))
    : input.line_items;

  const { data, error } = await supabase
    .from("tenders")
    .insert({
      user_id: user.id,
      entity: input.entity,
      tender_title: input.tender_title,
      tender_number: input.tender_number,
      deadline,
      estimated_value: input.estimated_value ?? null,
      description: input.description,
      requirements: input.requirements,
      line_items: derivedLineItems,
      extracted_sections: input.extracted_sections ?? null,
      source_type: "pdf" as const,
      source_file_name: input.source_file_name,
      source_file_path: null,
      extraction_confidence: Math.round(Number(input.extraction_confidence) || 0),
      extraction_warnings: input.extraction_warnings,
      status: "new" as const,
    })
    .select("id")
    .single();

  if (error) {
    console.error("[savePdfTender] Insert failed:", error.message, error.code, error.details);
    // Translate common Postgres errors to user-friendly Arabic
    let userMsg = "فشل حفظ المنافسة";
    if (error.code === "23505") {
      userMsg = "منافسة بنفس الرقم موجودة مسبقاً";
    } else if (error.code === "23502") {
      // NOT NULL violation — extract column name
      const col = error.message.match(/column "(\w+)"/)?.[1];
      const colLabel = col ? (COLUMN_LABELS[col] ?? col) : "حقل مطلوب";
      userMsg = `حقل "${colLabel}" مطلوب ولم يتم تعبئته`;
    } else if (error.code === "23514") {
      userMsg = "قيمة غير صالحة في أحد الحقول";
    } else if (error.code === "42501") {
      userMsg = "ليس لديك صلاحية لإضافة منافسات";
    } else {
      userMsg = "فشل حفظ المنافسة: " + error.message;
    }
    return { success: false, error: userMsg };
  }

  // --- Auto-seed cost_items from derived line_items (BOQ → flat) ---
  if (derivedLineItems.length > 0) {
    const costItems = derivedLineItems.map((item, idx) => ({
      tender_id: data.id,
      user_id: user.id,
      category: "direct" as const,
      description: item.description,
      quantity: item.quantity ?? 1,
      unit: item.unit ?? "وحدة",
      unit_price: 0, // needs pricing from rate cards or manual entry
      source: "ai_suggested" as const,
      source_notes: `استخرج من PDF (ثقة ${item.confidence}%)`,
      sort_order: idx,
    }));

    const { error: costError } = await supabase
      .from("cost_items")
      .insert(costItems);

    if (costError) {
      // Non-blocking: tender saved, cost seeding failed — log and continue
      console.error("[savePdfTender] Cost items seeding failed:", costError.message);
    }
  }

  revalidatePath("/tenders");
  revalidatePath("/dashboard");
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
    console.error("[uploadTenders] Auth failed:", authError?.message ?? "no user");
    return { success: false, error: "يجب تسجيل الدخول" };
  }

  const validated: (TenderInput & { tender_url?: string })[] = [];
  for (const t of tenders) {
    const raw = t as Record<string, unknown>;
    const deadlineStr = (raw.deadline as string) ?? "";
    const deadlineNorm = normalizeDeadline(deadlineStr);
    const ev = raw.estimated_value;
    const estimatedValue =
      typeof ev === "number" && !Number.isNaN(ev) ? ev : typeof ev === "string" && ev.trim() ? parseFloat(String(ev).replace(/[,،]/g, "")) : undefined;
    const parsed = tenderInputSchema.safeParse({
      ...raw,
      deadline: deadlineNorm ?? deadlineStr,
      estimated_value: Number.isNaN(estimatedValue) ? undefined : estimatedValue,
    });
    if (parsed.success && deadlineNorm) {
      validated.push({
        ...parsed.data,
        deadline: deadlineNorm,
        tender_url: typeof raw.tender_url === "string" ? raw.tender_url.trim() || undefined : undefined,
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
    estimated_value: tender.estimated_value ?? null,
    description: tender.description ?? null,
    requirements: tender.requirements
      ? tender.requirements.split("\n").filter((r) => r.trim())
      : [],
    tender_url: tender.tender_url ?? null,
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
    console.error("[uploadTenders] Insert failed:", error.message, error.code, error.details);
    return {
      success: false,
      error: "فشل حفظ المنافسات: " + error.message,
    };
  }

  revalidatePath("/tenders");
  revalidatePath("/dashboard");
  return {
    success: true,
    created: data?.length ?? 0,
    tenders: data ?? [],
  };
}

// ---------------------------------------------------------------------------
// Delete a tender (cascades to spec_cards, nominations, cost_items, evaluations)
// ---------------------------------------------------------------------------

export type DeleteTenderResult =
  | { success: true }
  | { success: false; error: string };

export async function deleteTender(tenderId: string): Promise<DeleteTenderResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: "يجب تسجيل الدخول" };
  }

  const { error } = await supabase
    .from("tenders")
    .delete()
    .eq("id", tenderId)
    .eq("user_id", user.id);

  if (error) {
    console.error("[deleteTender] Delete failed:", error.message);
    return { success: false, error: "فشل حذف المنافسة: " + error.message };
  }

  revalidatePath("/tenders");
  revalidatePath("/dashboard");
  return { success: true };
}
