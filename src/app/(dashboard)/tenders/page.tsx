import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { TenderListClient } from "@/components/tender/TenderListClient";

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
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">المنافسات</h1>
        <Link
          href="/tenders/upload"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-gold-600"
        >
          رفع منافسات
        </Link>
      </div>

      <TenderListClient initialTenders={tenders ?? []} />
    </div>
  );
}
