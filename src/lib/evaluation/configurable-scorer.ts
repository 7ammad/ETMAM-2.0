/**
 * Configurable Evaluation Scoring Engine
 *
 * Deterministic, formula-based scoring for each criterion.
 * No AI calls — pure math from user-supplied factor inputs.
 */

import type { Tender } from "@/types/database";
import type { Json } from "@/types/database";
import {
  type CriterionKey,
  type CriterionConfig,
  type CriterionScoreResult,
  type CriterionFactors,
  type ConfigurableEvalResult,
  type Decision,
  type ProfitFactors,
  type DeliveryFactors,
  type CashflowFactors,
  type ScopeFactors,
  type EntityRelationshipFactors,
  CRITERIA_META,
  ProfitFactorsSchema,
  DeliveryFactorsSchema,
  CashflowFactorsSchema,
  ScopeFactorsSchema,
  EntityRelationshipFactorsSchema,
} from "@/types/evaluation-profiles";
import { DECISION_THRESHOLDS } from "@/lib/constants";

// ---------------------------------------------------------------------------
// Auto-fill helpers — extract defaults from tender data
// ---------------------------------------------------------------------------

type ExtractedSections = {
  contract_terms?: {
    initial_guarantee?: number;
    payment_terms_days?: number;
    has_milestone_payments?: boolean;
    upfront_payment_pct?: number;
  };
  requirements_match?: {
    scope_match_pct?: number;
  };
  vendor_requirements?: {
    vendors?: string[];
  };
};

function parseExtractedSections(raw: Json | null | undefined): ExtractedSections {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  return raw as unknown as ExtractedSections;
}

export function autoFillProfitFactors(tender: Tender): ProfitFactors {
  const revenue = tender.estimated_value ?? 0;
  const totalCost = tender.total_cost ?? 0;

  // Try to infer cost breakdown from cost items if available
  return ProfitFactorsSchema.parse({
    revenue_sar: revenue,
    labor_cost_sar: totalCost > 0 ? Math.round(totalCost * 0.6) : 0, // common split
    tool_licenses_sar: 0,
    subcontractor_cost_sar: 0,
    indirect_cost_sar: totalCost > 0 ? Math.round(totalCost * 0.15) : 0,
    overhead_pct: 10,
    is_recurring: false,
    contract_years: 1,
    payment_terms_days: 30,
  });
}

export function autoFillDeliveryFactors(_tender: Tender): DeliveryFactors {
  return DeliveryFactorsSchema.parse({
    has_required_certs: true,
    missing_certs: [],
    current_saudization_pct: 30,
    required_saudization_pct: 30,
    team_available: 5,
    hires_needed: 0,
    has_past_experience: false,
    similar_projects_count: 0,
  });
}

export function autoFillCashflowFactors(tender: Tender): CashflowFactors {
  const sections = parseExtractedSections(tender.extracted_sections);
  const ct = sections.contract_terms;

  return CashflowFactorsSchema.parse({
    payment_terms_days: ct?.payment_terms_days ?? 30,
    has_milestone_payments: ct?.has_milestone_payments ?? false,
    upfront_payment_pct: ct?.upfront_payment_pct ?? 0,
    initial_guarantee_sar: ct?.initial_guarantee ?? 0,
    is_known_slow_payer: false,
  });
}

export function autoFillScopeFactors(tender: Tender): ScopeFactors {
  const sections = parseExtractedSections(tender.extracted_sections);

  return ScopeFactorsSchema.parse({
    scope_match_pct: sections.requirements_match?.scope_match_pct ?? 50,
    vendor_match: "compatible" as const,
    involves_new_tech: false,
    is_vendor_locked: false,
  });
}

export function autoFillEntityRelationshipFactors(_tender: Tender): EntityRelationshipFactors {
  return EntityRelationshipFactorsSchema.parse({
    relationship_type: "cold_bid" as const,
    past_contracts_count: 0,
    has_known_competitor_preference: false,
    competitor_name: "",
  });
}

export function autoFillAllFactors(tender: Tender): CriterionFactors {
  return {
    profit_potential: autoFillProfitFactors(tender),
    delivery_confidence: autoFillDeliveryFactors(tender),
    cashflow_risk: autoFillCashflowFactors(tender),
    scope_alignment: autoFillScopeFactors(tender),
    entity_relationship: autoFillEntityRelationshipFactors(tender),
  };
}

// ---------------------------------------------------------------------------
// Scoring functions — each returns 0-100 score + reasoning
// ---------------------------------------------------------------------------

function clamp(val: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, val));
}

export function scoreProfitPotential(
  f: ProfitFactors
): { score: number; reasoning: string } {
  const totalDirectCost = f.labor_cost_sar + f.tool_licenses_sar + f.subcontractor_cost_sar;
  const overheadAmount = totalDirectCost * (f.overhead_pct / 100);
  const totalCost = totalDirectCost + f.indirect_cost_sar + overheadAmount;
  const netProfit = f.revenue_sar - totalCost;
  const marginPct = f.revenue_sar > 0 ? (netProfit / f.revenue_sar) * 100 : 0;

  // Score mapping: 0% margin = 20, 15% = 60, 30%+ = 100
  let score: number;
  if (marginPct <= 0) {
    score = clamp(marginPct + 10, 0, 10); // loss = very low
  } else if (marginPct <= 15) {
    score = 20 + (marginPct / 15) * 40; // 0-15% → 20-60
  } else if (marginPct <= 30) {
    score = 60 + ((marginPct - 15) / 15) * 40; // 15-30% → 60-100
  } else {
    score = 100;
  }

  // Bonus for recurring contracts
  if (f.is_recurring && f.contract_years > 1) {
    score = clamp(score + 5);
  }

  // Penalty for long payment terms
  if (f.payment_terms_days > 60) {
    score = clamp(score - 5);
  }

  score = Math.round(clamp(score));
  const formattedMargin = marginPct.toFixed(1);
  const reasoning = `Net margin ${formattedMargin}% (revenue ${f.revenue_sar.toLocaleString()} SAR - costs ${totalCost.toLocaleString()} SAR)${
    f.is_recurring ? `, recurring ${f.contract_years}y` : ""
  }`;

  return { score, reasoning };
}

export function scoreDeliveryConfidence(
  f: DeliveryFactors
): { score: number; reasoning: string } {
  let score = 100;
  const reasons: string[] = [];

  // Certs (up to -30)
  if (!f.has_required_certs) {
    const penalty = Math.min(f.missing_certs.length * 15, 30);
    score -= penalty;
    reasons.push(`Missing certs: ${f.missing_certs.join(", ") || "unspecified"} (-${penalty})`);
  }

  // Saudization gap (up to -25)
  const saudiGap = f.required_saudization_pct - f.current_saudization_pct;
  if (saudiGap > 0) {
    const penalty = Math.min(Math.round(saudiGap * 0.5), 25);
    score -= penalty;
    reasons.push(`Saudization gap ${saudiGap}% (-${penalty})`);
  }

  // Staffing (up to -25)
  if (f.hires_needed > 0) {
    const ratio = f.team_available > 0 ? f.hires_needed / f.team_available : f.hires_needed;
    const penalty = Math.min(Math.round(ratio * 15), 25);
    score -= penalty;
    reasons.push(`Need ${f.hires_needed} hires (-${penalty})`);
  }

  // Experience bonus
  if (f.has_past_experience) {
    const bonus = Math.min(f.similar_projects_count * 5, 15);
    score += bonus;
    reasons.push(`${f.similar_projects_count} similar projects (+${bonus})`);
  }

  score = Math.round(clamp(score));
  const reasoning = reasons.length > 0 ? reasons.join("; ") : "All delivery requirements met";
  return { score, reasoning };
}

export function scoreCashflowRisk(
  f: CashflowFactors
): { score: number; reasoning: string } {
  let score = 80; // start optimistic
  const reasons: string[] = [];

  // Payment terms
  if (f.payment_terms_days <= 30) {
    score += 10;
    reasons.push("Payment ≤30 days (+10)");
  } else if (f.payment_terms_days > 90) {
    score -= 20;
    reasons.push(`Payment ${f.payment_terms_days} days (-20)`);
  } else if (f.payment_terms_days > 60) {
    score -= 10;
    reasons.push(`Payment ${f.payment_terms_days} days (-10)`);
  }

  // Milestone payments are good
  if (f.has_milestone_payments) {
    score += 10;
    reasons.push("Milestone payments (+10)");
  }

  // Upfront payment is great
  if (f.upfront_payment_pct > 0) {
    const bonus = Math.min(Math.round(f.upfront_payment_pct / 5), 10);
    score += bonus;
    reasons.push(`${f.upfront_payment_pct}% upfront (+${bonus})`);
  }

  // Large guarantee is risky (ties up capital)
  if (f.initial_guarantee_sar > 0) {
    const penalty = f.initial_guarantee_sar > 500_000 ? 15 : f.initial_guarantee_sar > 100_000 ? 10 : 5;
    score -= penalty;
    reasons.push(`Guarantee ${f.initial_guarantee_sar.toLocaleString()} SAR (-${penalty})`);
  }

  // Known slow payer
  if (f.is_known_slow_payer) {
    score -= 20;
    reasons.push("Known slow payer (-20)");
  }

  score = Math.round(clamp(score));
  return { score, reasoning: reasons.join("; ") || "Standard cash flow terms" };
}

export function scoreScopeAlignment(
  f: ScopeFactors
): { score: number; reasoning: string } {
  let score = f.scope_match_pct;
  const reasons: string[] = [`Scope match ${f.scope_match_pct}%`];

  // Vendor match bonus/penalty
  const vendorScores: Record<string, number> = {
    exact: 15,
    partner: 10,
    compatible: 0,
    none: -20,
  };
  const vendorDelta = vendorScores[f.vendor_match] ?? 0;
  if (vendorDelta !== 0) {
    score += vendorDelta;
    reasons.push(`Vendor: ${f.vendor_match} (${vendorDelta > 0 ? "+" : ""}${vendorDelta})`);
  }

  // New tech risk
  if (f.involves_new_tech) {
    score -= 10;
    reasons.push("New tech risk (-10)");
  }

  // Vendor lock-in
  if (f.is_vendor_locked) {
    score -= 15;
    reasons.push("Vendor lock-in (-15)");
  }

  score = Math.round(clamp(score));
  return { score, reasoning: reasons.join("; ") };
}

export function scoreEntityRelationship(
  f: EntityRelationshipFactors
): { score: number; reasoning: string } {
  const baseScores: Record<string, number> = {
    existing_client: 80,
    warm_lead: 60,
    cold_bid: 40,
  };

  let score = baseScores[f.relationship_type] ?? 40;
  const reasons: string[] = [`Relationship: ${f.relationship_type.replace("_", " ")}`];

  // Past contracts bonus
  if (f.past_contracts_count > 0) {
    const bonus = Math.min(f.past_contracts_count * 10, 20);
    score += bonus;
    reasons.push(`${f.past_contracts_count} past contracts (+${bonus})`);
  }

  // Competitor preference penalty
  if (f.has_known_competitor_preference) {
    score -= 25;
    reasons.push(`Competitor preference${f.competitor_name ? ` (${f.competitor_name})` : ""} (-25)`);
  }

  score = Math.round(clamp(score));
  return { score, reasoning: reasons.join("; ") };
}

// ---------------------------------------------------------------------------
// Main orchestrator
// ---------------------------------------------------------------------------

const SCORE_FNS: Record<
  CriterionKey,
  (factors: never) => { score: number; reasoning: string }
> = {
  profit_potential: scoreProfitPotential as (f: never) => { score: number; reasoning: string },
  delivery_confidence: scoreDeliveryConfidence as (f: never) => { score: number; reasoning: string },
  cashflow_risk: scoreCashflowRisk as (f: never) => { score: number; reasoning: string },
  scope_alignment: scoreScopeAlignment as (f: never) => { score: number; reasoning: string },
  entity_relationship: scoreEntityRelationship as (f: never) => { score: number; reasoning: string },
};

export function runConfigurableEvaluation(
  criteria: CriterionConfig[],
  allFactors: Partial<CriterionFactors>,
  profile: { id: string; name: string },
  thresholds: { go: number; maybe: number } = DECISION_THRESHOLDS
): ConfigurableEvalResult {
  const enabled = criteria.filter((c) => c.enabled);
  const totalWeight = enabled.reduce((s, c) => s + c.weight, 0);

  const criteriaScores: CriterionScoreResult[] = enabled.map((c) => {
    const meta = CRITERIA_META[c.key];
    const factors = allFactors[c.key] ?? {};
    const scoreFn = SCORE_FNS[c.key];
    const { score: rawScore, reasoning } = scoreFn(factors as never);
    const normalizedWeight = totalWeight > 0 ? c.weight / totalWeight : 0;
    const weightedScore = Math.round(rawScore * normalizedWeight * 100) / 100;

    return {
      key: c.key,
      label: meta.label,
      labelAr: meta.labelAr,
      weight: c.weight,
      rawScore,
      weightedScore,
      factors: factors as Record<string, unknown>,
      reasoning,
    };
  });

  const finalScore = Math.round(
    criteriaScores.reduce((s, c) => s + c.weightedScore, 0)
  );

  let decision: Decision;
  if (finalScore >= thresholds.go) {
    decision = "GO";
  } else if (finalScore >= thresholds.maybe) {
    decision = "MAYBE";
  } else {
    decision = "SKIP";
  }

  // Build summary
  const topCriterion = criteriaScores.reduce((best, c) =>
    c.weightedScore > best.weightedScore ? c : best
  );
  const worstCriterion = criteriaScores.reduce((worst, c) =>
    c.weightedScore < worst.weightedScore ? c : worst
  );

  const summary = `Score: ${finalScore}/100 → ${decision}. Strongest: ${topCriterion.label} (${topCriterion.rawScore}). Weakest: ${worstCriterion.label} (${worstCriterion.rawScore}).`;

  return {
    profileId: profile.id,
    profileName: profile.name,
    finalScore,
    decision,
    criteriaScores,
    summary,
    evaluatedAt: new Date().toISOString(),
  };
}
