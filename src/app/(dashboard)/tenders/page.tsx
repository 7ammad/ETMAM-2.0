import { createClient } from "@/lib/supabase/server";
import { TenderListClient } from "@/components/tender/TenderListClient";
import { BatchExportActions } from "@/components/export/BatchExportActions";
import { LocalizedHeading } from "@/components/ui/localized-heading";

export default async function TendersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: tenders } = await supabase
    .from("tenders")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <LocalizedHeading i18nKey="tenders" className="text-2xl font-bold text-foreground" />
        <BatchExportActions />
      </div>

      <TenderListClient initialTenders={tenders ?? []} />
    </div>
  );
}
