import { z } from "zod";

// ---------------------------------------------------------------------------
// Criterion keys
// ---------------------------------------------------------------------------
export const CRITERION_KEYS = [
  "profit_potential",
  "delivery_confidence",
  "cashflow_risk",
  "scope_alignment",
  "entity_relationship",
] as const;

export type CriterionKey = (typeof CRITERION_KEYS)[number];

// ---------------------------------------------------------------------------
// Criterion metadata (static, never stored in DB)
// ---------------------------------------------------------------------------
export interface CriterionMeta {
  key: CriterionKey;
  label: string;
  labelAr: string;
  description: string;
  defaultWeight: number;
  defaultEnabled: boolean;
  alwaysOn: boolean;
  minWeight: number;
  icon: string; // lucide icon name
}

export const CRITERIA_META: Record<CriterionKey, CriterionMeta> = {
  profit_potential: {
    key: "profit_potential",
    label: "Net Profit Potential",
    labelAr: "صافي الربح المتوقع",
    description: "Margin after labor, tools, subcontractors, overhead",
    defaultWeight: 50,
    defaultEnabled: true,
    alwaysOn: true,
    minWeight: 30,
    icon: "TrendingUp",
  },
  delivery_confidence: {
    key: "delivery_confidence",
    label: "Delivery Confidence",
    labelAr: "ثقة التنفيذ",
    description: "NCA certs, Saudization %, staffing readiness, experience",
    defaultWeight: 25,
    defaultEnabled: true,
    alwaysOn: false,
    minWeight: 0,
    icon: "ShieldCheck",
  },
  cashflow_risk: {
    key: "cashflow_risk",
    label: "Cash Flow Risk",
    labelAr: "مخاطر السيولة",
    description: "Payment terms, guarantees, milestone structure",
    defaultWeight: 15,
    defaultEnabled: true,
    alwaysOn: false,
    minWeight: 0,
    icon: "Banknote",
  },
  scope_alignment: {
    key: "scope_alignment",
    label: "Scope Alignment",
    labelAr: "توافق النطاق",
    description: "Vendor match, tech familiarity, lock-in risk",
    defaultWeight: 10,
    defaultEnabled: false,
    alwaysOn: false,
    minWeight: 0,
    icon: "Target",
  },
  entity_relationship: {
    key: "entity_relationship",
    label: "Entity Relationship",
    labelAr: "العلاقة مع الجهة",
    description: "Existing client vs cold bid, competitor presence",
    defaultWeight: 0,
    defaultEnabled: false,
    alwaysOn: false,
    minWeight: 0,
    icon: "Handshake",
  },
};

// ---------------------------------------------------------------------------
// Criterion config (stored in evaluation_presets.criteria JSONB)
// ---------------------------------------------------------------------------
export interface CriterionConfig {
  key: CriterionKey;
  enabled: boolean;
  weight: number;
}

// ---------------------------------------------------------------------------
// Factor schemas (Zod) — one per criterion
// ---------------------------------------------------------------------------
export const ProfitFactorsSchema = z.object({
  revenue_sar: z.number().nonnegative().default(0),
  labor_cost_sar: z.number().nonnegative().default(0),
  tool_licenses_sar: z.number().nonnegative().default(0),
  subcontractor_cost_sar: z.number().nonnegative().default(0),
  indirect_cost_sar: z.number().nonnegative().default(0),
  overhead_pct: z.number().min(0).max(100).default(10),
  is_recurring: z.boolean().default(false),
  contract_years: z.number().min(1).default(1),
  payment_terms_days: z.number().nonnegative().default(30),
});
export type ProfitFactors = z.infer<typeof ProfitFactorsSchema>;

export const DeliveryFactorsSchema = z.object({
  has_required_certs: z.boolean().default(true),
  missing_certs: z.array(z.string()).default([]),
  current_saudization_pct: z.number().min(0).max(100).default(30),
  required_saudization_pct: z.number().min(0).max(100).default(30),
  team_available: z.number().nonnegative().default(0),
  hires_needed: z.number().nonnegative().default(0),
  has_past_experience: z.boolean().default(false),
  similar_projects_count: z.number().nonnegative().default(0),
});
export type DeliveryFactors = z.infer<typeof DeliveryFactorsSchema>;

export const CashflowFactorsSchema = z.object({
  payment_terms_days: z.number().nonnegative().default(30),
  has_milestone_payments: z.boolean().default(false),
  upfront_payment_pct: z.number().min(0).max(100).default(0),
  initial_guarantee_sar: z.number().nonnegative().default(0),
  is_known_slow_payer: z.boolean().default(false),
});
export type CashflowFactors = z.infer<typeof CashflowFactorsSchema>;

export const ScopeFactorsSchema = z.object({
  scope_match_pct: z.number().min(0).max(100).default(50),
  vendor_match: z.enum(["exact", "partner", "compatible", "none"]).default("compatible"),
  involves_new_tech: z.boolean().default(false),
  is_vendor_locked: z.boolean().default(false),
});
export type ScopeFactors = z.infer<typeof ScopeFactorsSchema>;

export const EntityRelationshipFactorsSchema = z.object({
  relationship_type: z.enum(["existing_client", "warm_lead", "cold_bid"]).default("cold_bid"),
  past_contracts_count: z.number().nonnegative().default(0),
  has_known_competitor_preference: z.boolean().default(false),
  competitor_name: z.string().default(""),
});
export type EntityRelationshipFactors = z.infer<typeof EntityRelationshipFactorsSchema>;

// ---------------------------------------------------------------------------
// Mapped factor types
// ---------------------------------------------------------------------------
export type CriterionFactors = {
  profit_potential: ProfitFactors;
  delivery_confidence: DeliveryFactors;
  cashflow_risk: CashflowFactors;
  scope_alignment: ScopeFactors;
  entity_relationship: EntityRelationshipFactors;
};

export const FACTOR_SCHEMAS: Record<CriterionKey, z.ZodType> = {
  profit_potential: ProfitFactorsSchema,
  delivery_confidence: DeliveryFactorsSchema,
  cashflow_risk: CashflowFactorsSchema,
  scope_alignment: ScopeFactorsSchema,
  entity_relationship: EntityRelationshipFactorsSchema,
};

// ---------------------------------------------------------------------------
// Score results
// ---------------------------------------------------------------------------
export type Decision = "GO" | "MAYBE" | "SKIP";

/** Maps Decision to the DB recommendation enum */
export const DECISION_TO_DB: Record<Decision, "proceed" | "review" | "skip"> = {
  GO: "proceed",
  MAYBE: "review",
  SKIP: "skip",
};

export interface CriterionScoreResult {
  key: CriterionKey;
  label: string;
  labelAr: string;
  weight: number;
  rawScore: number; // 0-100
  weightedScore: number; // rawScore * (weight/100)
  factors: Record<string, unknown>;
  reasoning: string;
}

export interface ConfigurableEvalResult {
  profileId: string;
  profileName: string;
  finalScore: number; // 0-100
  decision: Decision;
  criteriaScores: CriterionScoreResult[];
  summary: string;
  evaluatedAt: string; // ISO date
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
export function getDefaultCriteriaConfig(): CriterionConfig[] {
  return CRITERION_KEYS.map((key) => ({
    key,
    enabled: CRITERIA_META[key].defaultEnabled,
    weight: CRITERIA_META[key].defaultWeight,
  }));
}

export function validateCriteriaWeights(
  criteria: CriterionConfig[]
): { valid: boolean; error?: string } {
  const enabled = criteria.filter((c) => c.enabled);

  // profit_potential must always be enabled
  const profit = criteria.find((c) => c.key === "profit_potential");
  if (!profit || !profit.enabled) {
    return { valid: false, error: "Net Profit Potential must always be enabled" };
  }

  // Check min weights
  for (const c of enabled) {
    const meta = CRITERIA_META[c.key];
    if (c.weight < meta.minWeight) {
      return {
        valid: false,
        error: `${meta.label} weight (${c.weight}) is below minimum (${meta.minWeight})`,
      };
    }
  }

  // Enabled weights must sum to 100
  const sum = enabled.reduce((s, c) => s + c.weight, 0);
  if (sum !== 100) {
    return {
      valid: false,
      error: `Enabled criteria weights must sum to 100 (currently ${sum})`,
    };
  }

  return { valid: true };
}
