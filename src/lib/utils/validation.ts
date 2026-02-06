/**
 * Zod schemas shared between client and server.
 */
import { z } from "zod/v4";

export const createTenderSchema = z.object({
  entity: z.string().min(1, "الجهة مطلوبة").max(200),
  tender_title: z.string().min(1, "عنوان المنافسة مطلوب").max(500),
  tender_number: z.string().min(1, "رقم المنافسة مطلوب").max(100),
  deadline: z.string().min(1, "الموعد النهائي مطلوب"),
  estimated_value: z.number().positive("القيمة يجب أن تكون أكبر من صفر"),
  description: z.string().optional(),
  requirements: z.array(z.string()).optional().default([]),
  source_type: z.enum(["csv", "excel", "pdf", "manual"]),
});

export const evaluationScoreSchema = z.object({
  tender_id: z.string().uuid(),
  criteria_scores: z.record(
    z.string(),
    z.object({
      score: z.number().min(0).max(100),
      weight: z.number().min(0).max(100),
      notes: z.string().optional(),
    })
  ),
  preset_id: z.string().uuid().optional(),
  manual_override: z.enum(["proceed", "review", "skip"]).optional(),
  override_reason: z.string().optional(),
});

export const odooConfigSchema = z.object({
  url: z.string().url("رابط Odoo غير صالح"),
  db: z.string().min(1, "اسم قاعدة البيانات مطلوب"),
  username: z.string().min(1, "اسم المستخدم مطلوب"),
  api_key: z.string().min(1, "مفتاح API مطلوب"),
});

export const costItemSchema = z.object({
  tender_id: z.string().uuid(),
  category: z.enum(["direct", "indirect"]),
  subcategory: z.string().optional(),
  description: z.string().min(1, "وصف البند مطلوب"),
  quantity: z.number().positive(),
  unit: z.string().min(1),
  unit_price: z.number().min(0),
  source: z.enum(["rate_card", "manual", "ai_suggested"]),
  rate_card_item_id: z.string().uuid().optional(),
  source_notes: z.string().optional(),
});

export type CreateTenderInput = z.infer<typeof createTenderSchema>;
export type EvaluationScoreInput = z.infer<typeof evaluationScoreSchema>;
export type OdooConfigInput = z.infer<typeof odooConfigSchema>;
export type CostItemInput = z.infer<typeof costItemSchema>;
