import { createClient } from "@/lib/supabase/server";
import { StatsRow } from "@/components/dashboard/StatsRow";
import { RecentTenders } from "@/components/dashboard/RecentTenders";
import { PipelineSummary } from "@/components/dashboard/PipelineSummary";
import { ScoreDistribution } from "@/components/dashboard/ScoreDistribution";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return (
      <main className="p-6">
        <p className="text-muted-foreground">يجب تسجيل الدخول.</p>
      </main>
    );
  }

  const [tendersRes, entriesRes] = await Promise.all([
    supabase
      .from("tenders")
      .select("id, tender_title, entity, evaluation_score, status, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("pipeline_entries")
      .select("stage_id")
      .eq("user_id", user.id),
  ]);

  const tenders = tendersRes.data ?? [];
  const entries = entriesRes.data ?? [];

  const totalTenders = tenders.length;
  const withScore = tenders.filter((t) => t.evaluation_score != null);
  const analyzedCount = withScore.length;
  const averageScore =
    withScore.length > 0
      ? withScore.reduce((a, t) => a + (t.evaluation_score ?? 0), 0) / withScore.length
      : null;

  const stageCounts: Record<string, number> = {};
  for (const e of entries) {
    stageCounts[e.stage_id] = (stageCounts[e.stage_id] ?? 0) + 1;
  }
  const pushedToCrm = stageCounts["pushed"] ?? 0;

  const recentTenders = tenders.slice(0, 5).map((t) => ({
    id: t.id,
    tender_title: t.tender_title,
    entity: t.entity,
    evaluation_score: t.evaluation_score,
    status: t.status,
  }));

  const buckets: [number, number, number, number] = [0, 0, 0, 0];
  for (const t of tenders) {
    const s = t.evaluation_score;
    if (s == null) continue;
    if (s <= 25) buckets[0]++;
    else if (s <= 50) buckets[1]++;
    else if (s <= 75) buckets[2]++;
    else buckets[3]++;
  }

  return (
    <main className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">لوحة التحكم</h1>
        <Link
          href="/tenders/upload"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          رفع منافسة جديدة
        </Link>
      </div>

      <StatsRow
        totalTenders={totalTenders}
        analyzedCount={analyzedCount}
        averageScore={averageScore}
        pushedToCrm={pushedToCrm}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <RecentTenders tenders={recentTenders} />
        <PipelineSummary stageCounts={stageCounts} />
      </div>

      <ScoreDistribution counts={buckets} />
    </main>
  );
}
