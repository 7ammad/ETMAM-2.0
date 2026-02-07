import { createClient } from "@/lib/supabase/server";
import { StatsRow } from "@/components/dashboard/StatsRow";
import { RecentTenders } from "@/components/dashboard/RecentTenders";
import { ExportSummary } from "@/components/dashboard/ExportSummary";
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

  const { data: tendersData } = await supabase
    .from("tenders")
    .select("id, tender_title, entity, evaluation_score, status, created_at, odoo_lead_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const tenders = tendersData ?? [];
  const totalTenders = tenders.length;
  const withScore = tenders.filter((t) => t.evaluation_score != null);
  const analyzedCount = withScore.length;
  const averageScore =
    withScore.length > 0
      ? withScore.reduce((a, t) => a + (t.evaluation_score ?? 0), 0) / withScore.length
      : null;
  /** PRD: CRM = Odoo + Excel. Count tenders actually pushed to Odoo (not pipeline stage). */
  const pushedToCrm = tenders.filter((t) => t.odoo_lead_id != null).length;

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

  if (totalTenders === 0) {
    return (
      <main className="flex min-h-[50vh] flex-col items-center justify-center p-6">
        <div className="rounded-lg border border-border bg-card p-8 text-center shadow-sm">
          <h2 className="text-lg font-semibold text-foreground">ابدأ برفع أول منافسة</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            ارفع ملف Excel أو CSV أو PDF لاستخراج البيانات والتقييم.
          </p>
          <Link
            href="/tenders"
            className="mt-4 inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            رفع منافسة جديدة
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-foreground">لوحة التحكم</h1>
        <Link
          href="/tenders"
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
        <ExportSummary pushedToOdoo={pushedToCrm} />
      </div>

      <ScoreDistribution counts={buckets} />
    </main>
  );
}
