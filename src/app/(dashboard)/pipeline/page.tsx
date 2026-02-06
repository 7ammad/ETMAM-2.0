import { createClient } from "@/lib/supabase/server";
import { PipelineBoard } from "@/components/pipeline/PipelineBoard";
import type { PipelineEntry } from "@/types/database";
import type { Tender } from "@/types/database";

type EntryRow = PipelineEntry & { tenders: Tender | null };

export default async function PipelinePage() {
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

  const [stagesRes, entriesRes] = await Promise.all([
    supabase
      .from("pipeline_stages")
      .select("*")
      .order("display_order", { ascending: true }),
    supabase
      .from("pipeline_entries")
      .select("*, tenders(*)")
      .eq("user_id", user.id),
  ]);

  const stages = stagesRes.data ?? [];
  const rows = (entriesRes.data ?? []) as EntryRow[];
  const entries: PipelineEntry[] = rows.map((e) => ({
    id: e.id,
    tender_id: e.tender_id,
    stage_id: e.stage_id,
    user_id: e.user_id,
    moved_at: e.moved_at,
    notes: e.notes,
  }));
  const tenders: Tender[] = rows.map((e) => e.tenders).filter((t): t is Tender => t != null);

  return (
    <main className="p-6">
      <h1 className="mb-6 text-2xl font-bold text-foreground">المسار</h1>
      <PipelineBoard
        stages={stages}
        entries={entries}
        tenders={tenders}
      />
    </main>
  );
}
