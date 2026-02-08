"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import {
  type CriterionConfig,
  type CriterionFactors,
  type ConfigurableEvalResult,
  DECISION_TO_DB,
  getDefaultCriteriaConfig,
  validateCriteriaWeights,
  FACTOR_SCHEMAS,
  CRITERION_KEYS,
} from "@/types/evaluation-profiles";
import {
  autoFillAllFactors,
  runConfigurableEvaluation,
} from "@/lib/evaluation/configurable-scorer";
import { DECISION_THRESHOLDS } from "@/lib/constants";
import type { Json } from "@/types/database";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

// ---------------------------------------------------------------------------
// getAutoFilledFactors — returns auto-filled factors for UI pre-population
// ---------------------------------------------------------------------------
export async function getAutoFilledFactors(
  tenderId: string
): Promise<ActionResult<Partial<CriterionFactors>>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "يجب تسجيل الدخول" };

  const { data: tender, error } = await supabase
    .from("tenders")
    .select("*")
    .eq("id", tenderId)
    .eq("user_id", user.id)
    .single();

  if (error || !tender) {
    return { success: false, error: "المنافسة غير موجودة" };
  }

  const factors = autoFillAllFactors(tender);
  return { success: true, data: factors };
}

// ---------------------------------------------------------------------------
// evaluateConfigurable — run evaluation, persist to DB
// ---------------------------------------------------------------------------
export async function evaluateConfigurable(
  tenderId: string,
  profileId: string,
  factorOverrides: Partial<CriterionFactors>
): Promise<ActionResult<ConfigurableEvalResult>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "يجب تسجيل الدخول" };

  // Load tender
  const { data: tender, error: tenderErr } = await supabase
    .from("tenders")
    .select("*")
    .eq("id", tenderId)
    .eq("user_id", user.id)
    .single();
  if (tenderErr || !tender) {
    return { success: false, error: "المنافسة غير موجودة" };
  }

  // Load profile
  const { data: preset, error: presetErr } = await supabase
    .from("evaluation_presets")
    .select("*")
    .eq("id", profileId)
    .eq("user_id", user.id)
    .single();
  if (presetErr || !preset) {
    return { success: false, error: "ملف التقييم غير موجود" };
  }

  const criteria = preset.criteria as unknown as CriterionConfig[];
  const validation = validateCriteriaWeights(criteria);
  if (!validation.valid) {
    return { success: false, error: validation.error! };
  }

  // Merge auto-filled with overrides, validate each factor set
  const autoFilled = autoFillAllFactors(tender);
  const mergedFactors: Partial<CriterionFactors> = {};

  for (const key of CRITERION_KEYS) {
    const criterion = criteria.find((c) => c.key === key);
    if (!criterion?.enabled) continue;

    const auto = autoFilled[key] ?? {};
    const override = factorOverrides[key] ?? {};
    const merged = { ...auto, ...override };

    // Validate with Zod schema
    const schema = FACTOR_SCHEMAS[key];
    const parsed = schema.safeParse(merged);
    if (!parsed.success) {
      return {
        success: false,
        error: `Invalid factors for ${key}: ${parsed.error.message}`,
      };
    }
    (mergedFactors as Record<string, unknown>)[key] = parsed.data;
  }

  // Run scoring
  const result = runConfigurableEvaluation(
    criteria,
    mergedFactors,
    { id: preset.id, name: preset.name },
    DECISION_THRESHOLDS
  );

  // Persist to evaluations table
  const dbRecommendation = DECISION_TO_DB[result.decision];
  const criteriaScoresJson = {
    scores: Object.fromEntries(
      result.criteriaScores.map((c) => [
        c.key,
        { raw: c.rawScore, weighted: c.weightedScore, reasoning: c.reasoning },
      ])
    ),
    summary: result.summary,
    evaluation_mode: "configurable",
  } as unknown as Json;

  const { error: evalErr } = await supabase.from("evaluations").insert({
    tender_id: tenderId,
    user_id: user.id,
    criteria_scores: criteriaScoresJson,
    overall_score: result.finalScore,
    auto_recommendation: dbRecommendation,
    manual_override: null,
    override_reason: null,
    preset_id: profileId,
    factor_inputs: mergedFactors as unknown as Json,
    decision: result.decision,
    updated_at: new Date().toISOString(),
  });

  if (evalErr) {
    console.error("[evaluateConfigurable] Insert failed:", evalErr);
    return { success: false, error: "فشل حفظ التقييم: " + evalErr.message };
  }

  revalidatePath("/tenders");
  revalidatePath(`/tenders/${tenderId}`);
  revalidatePath("/dashboard");

  return { success: true, data: result };
}

// ---------------------------------------------------------------------------
// Profile CRUD — uses existing evaluation_presets table
// ---------------------------------------------------------------------------

export async function listEvaluationProfiles() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false as const, error: "يجب تسجيل الدخول" };

  const { data, error } = await supabase
    .from("evaluation_presets")
    .select("*")
    .eq("user_id", user.id)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) return { success: false as const, error: error.message };
  return { success: true as const, data: data ?? [] };
}

export async function getDefaultProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false as const, error: "يجب تسجيل الدخول" };

  const { data, error } = await supabase
    .from("evaluation_presets")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_default", true)
    .single();

  if (error || !data) {
    // Seed default profile
    return seedDefaultProfile();
  }

  return { success: true as const, data };
}

export async function seedDefaultProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false as const, error: "يجب تسجيل الدخول" };

  const defaultCriteria = getDefaultCriteriaConfig();

  const { data, error } = await supabase
    .from("evaluation_presets")
    .insert({
      user_id: user.id,
      name: "Default Configurable",
      is_default: true,
      criteria: defaultCriteria as unknown as Json,
    })
    .select()
    .single();

  if (error) {
    // May fail due to unique index on (user_id) WHERE is_default = TRUE
    // In that case, fetch the existing default
    const { data: existing } = await supabase
      .from("evaluation_presets")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_default", true)
      .single();

    if (existing) return { success: true as const, data: existing };
    return { success: false as const, error: error.message };
  }

  return { success: true as const, data };
}

export async function createProfile(input: {
  name: string;
  criteria: CriterionConfig[];
  is_default?: boolean;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false as const, error: "يجب تسجيل الدخول" };

  const validation = validateCriteriaWeights(input.criteria);
  if (!validation.valid) {
    return { success: false as const, error: validation.error! };
  }

  const { data, error } = await supabase
    .from("evaluation_presets")
    .insert({
      user_id: user.id,
      name: input.name,
      is_default: input.is_default ?? false,
      criteria: input.criteria as unknown as Json,
    })
    .select()
    .single();

  if (error) return { success: false as const, error: error.message };
  return { success: true as const, data };
}

export async function updateProfile(
  profileId: string,
  input: { name?: string; criteria?: CriterionConfig[]; is_default?: boolean }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false as const, error: "يجب تسجيل الدخول" };

  if (input.criteria) {
    const validation = validateCriteriaWeights(input.criteria);
    if (!validation.valid) {
      return { success: false as const, error: validation.error! };
    }
  }

  const updateData: Record<string, unknown> = {};
  if (input.name !== undefined) updateData.name = input.name;
  if (input.criteria !== undefined) updateData.criteria = input.criteria;
  if (input.is_default !== undefined) updateData.is_default = input.is_default;

  const { data, error } = await supabase
    .from("evaluation_presets")
    .update(updateData)
    .eq("id", profileId)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) return { success: false as const, error: error.message };
  return { success: true as const, data };
}

export async function deleteProfile(profileId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false as const, error: "يجب تسجيل الدخول" };

  const { error } = await supabase
    .from("evaluation_presets")
    .delete()
    .eq("id", profileId)
    .eq("user_id", user.id);

  if (error) return { success: false as const, error: error.message };
  return { success: true as const, data: undefined };
}
