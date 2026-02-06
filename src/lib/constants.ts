export const APP_NAME = "إتمام";
export const APP_NAME_EN = "Etmam";
export const APP_DESCRIPTION =
  "نظام ذكي لإدارة المنافسات الحكومية — من الملف إلى الفرصة في دقائق";

export const PIPELINE_STAGES = [
  { id: "new", label: "New", labelAr: "جديد", color: "gray" },
  { id: "scored", label: "Scored", labelAr: "مُقيّم", color: "purple" },
  { id: "approved", label: "Approved", labelAr: "معتمد", color: "blue" },
  { id: "pushed", label: "Pushed to CRM", labelAr: "تم الدفع", color: "green" },
  { id: "won", label: "Won", labelAr: "فاز", color: "gold" },
  { id: "lost", label: "Lost", labelAr: "خسر", color: "red" },
] as const;

export type PipelineStageId = (typeof PIPELINE_STAGES)[number]["id"];

export const DEFAULT_SCORING_WEIGHTS = {
  relevance: 30,
  budgetFit: 25,
  timeline: 20,
  competition: 15,
  strategic: 10,
} as const;

export const CONFIDENCE_THRESHOLDS = {
  high: 75,
  medium: 50,
} as const;

export const MAX_FILE_SIZE_MB = 10;
export const MAX_PDF_SIZE_MB = 20;

export const ACCEPTED_UPLOAD_FORMATS = [".csv", ".xlsx", ".xls"] as const;
export const ACCEPTED_PDF_FORMATS = [".pdf"] as const;

export const TENDER_STATUSES = ["new", "evaluated", "costed", "exported"] as const;
export type TenderStatus = (typeof TENDER_STATUSES)[number];

export const RECOMMENDATION_TYPES = ["proceed", "review", "skip"] as const;
export type RecommendationType = (typeof RECOMMENDATION_TYPES)[number];

export const COST_CATEGORIES = ["direct", "indirect"] as const;
export type CostCategory = (typeof COST_CATEGORIES)[number];

export const COST_SOURCES = ["rate_card", "manual", "ai_suggested"] as const;
export type CostSource = (typeof COST_SOURCES)[number];

export const SOURCE_TYPES = ["csv", "excel", "pdf", "manual"] as const;
export type SourceType = (typeof SOURCE_TYPES)[number];
