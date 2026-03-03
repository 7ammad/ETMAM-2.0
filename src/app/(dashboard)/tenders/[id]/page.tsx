import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TenderOverview } from "@/components/tender/TenderOverview";

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

  return <TenderOverview tenderId={id} tender={tender} />;
}
