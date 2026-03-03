import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getOpportunities } from "@/app/actions/crm";
import { OpportunitiesListClient } from "@/components/crm/OpportunitiesListClient";
import { LocalizedHeading } from "@/components/ui/localized-heading";

export default async function OpportunitiesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const result = await getOpportunities();

  if (!result.success) {
    return (
      <main className="p-6">
        <p className="text-destructive">{result.error}</p>
      </main>
    );
  }

  return (
    <main className="space-y-6">
      <div className="flex items-center justify-between">
        <LocalizedHeading i18nKey="opportunities" className="text-2xl font-bold text-foreground tracking-tight" />
      </div>
      <OpportunitiesListClient
        opportunities={result.opportunities}
        stats={result.stats}
      />
    </main>
  );
}
