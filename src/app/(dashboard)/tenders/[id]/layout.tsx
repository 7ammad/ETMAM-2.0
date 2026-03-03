import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ReactNode } from "react";
import { TenderHeader } from "@/components/tender/TenderHeader";

export default async function TenderLayout({
  children,
  params,
}: {
  children: ReactNode;
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

  const { data: tender } = await supabase
    .from("tenders")
    .select("id, tender_title, entity, evaluation_score, deadline, status")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!tender) {
    notFound();
  }

  return (
    <div className="space-y-6" dir="rtl">
      <TenderHeader
        tenderId={id}
        title={tender.tender_title}
        entity={tender.entity}
        score={tender.evaluation_score}
        deadline={tender.deadline}
        status={tender.status}
      />
      {children}
    </div>
  );
}
