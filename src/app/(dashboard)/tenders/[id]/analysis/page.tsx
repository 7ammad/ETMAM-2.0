import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AnalysisView } from "@/components/analysis/AnalysisView";

export default async function AnalysisPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    notFound();
  }

  // Verify tender exists and belongs to user
  const { data: tender } = await supabase
    .from("tenders")
    .select("id, tender_title")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!tender) {
    notFound();
  }

  // Fetch latest evaluation
  const { data: evaluation } = await supabase
    .from("evaluations")
    .select("*")
    .eq("tender_id", id)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const evaluationData =
    evaluation != null
      ? {
          overall_score: evaluation.overall_score,
          auto_recommendation: evaluation.auto_recommendation,
          criteria_scores: (evaluation.criteria_scores ?? {}) as Record<
            string,
            unknown
          >,
          updated_at: evaluation.updated_at,
        }
      : null;

  return <AnalysisView tenderId={id} evaluation={evaluationData} />;
}
