import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TenderDetailClient } from "@/components/tender/TenderDetailClient";

export default async function TenderDetailPage({
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

  const { data: tender, error: tenderError } = await supabase
    .from("tenders")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (tenderError || !tender) {
    notFound();
  }

  const { data: evaluation } = await supabase
    .from("evaluations")
    .select("*")
    .eq("tender_id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  return (
    <main className="p-6">
      <TenderDetailClient
        tenderId={id}
        tender={tender}
        evaluation={evaluation ?? null}
      />
    </main>
  );
}
