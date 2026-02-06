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
