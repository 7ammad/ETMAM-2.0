import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { getOpportunity } from "@/app/actions/crm";
import { OpportunityDetailClient } from "@/components/crm/OpportunityDetailClient";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function OpportunityDetailPage({ params }: Props) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const result = await getOpportunity(id);

  if (!result.success) {
    notFound();
  }

  return (
    <main className="space-y-6">
      <OpportunityDetailClient
        opportunity={result.opportunity}
        autoRecommendation={result.auto_recommendation}
      />
    </main>
  );
}
