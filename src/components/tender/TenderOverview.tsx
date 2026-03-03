"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Tender } from "@/types/database";
import { Button } from "@/components/ui";
import { deleteTender } from "@/app/actions/tenders";
import { Trash2 } from "lucide-react";

interface TenderOverviewProps {
  tenderId: string;
  tender: Tender;
}

export function TenderOverview({ tenderId, tender }: TenderOverviewProps) {
  const router = useRouter();
  const [error, setError] = useState<string | undefined>();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (
      !confirm(
        "هل أنت متأكد من حذف هذه المنافسة؟ سيتم حذف جميع البيانات المرتبطة بها."
      )
    )
      return;
    setDeleting(true);
    const result = await deleteTender(tenderId);
    if (result.success) {
      router.push("/tenders");
    } else {
      setError(result.error);
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-8">
      {error && (
        <div
          role="alert"
          className="rounded-lg bg-confidence-low/10 border border-confidence-low/25 p-3 text-sm text-confidence-low"
        >
          {error}
        </div>
      )}

      {/* Metadata grid — 60/40 split */}
      <div className="grid gap-8 sm:grid-cols-5">
        {/* Primary details — 3/5 */}
        <div className="sm:col-span-3 space-y-5">
          <dl className="space-y-4">
            <div>
              <dt className="text-overline text-muted-foreground">رقم المنافسة</dt>
              <dd className="text-foreground font-medium font-data mt-1">
                {tender.tender_number}
              </dd>
            </div>
            <div>
              <dt className="text-overline text-muted-foreground">الجهة</dt>
              <dd className="text-foreground font-medium mt-1">{tender.entity}</dd>
            </div>
            {tender.description && (
              <div>
                <dt className="text-overline text-muted-foreground">الوصف</dt>
                <dd className="text-foreground leading-relaxed mt-1">
                  {tender.description}
                </dd>
              </div>
            )}
          </dl>
        </div>

        {/* Financial & date details — 2/5 */}
        <div className="sm:col-span-2 space-y-5">
          <dl className="space-y-4">
            <div>
              <dt className="text-overline text-muted-foreground">القيمة التقديرية</dt>
              <dd className="text-foreground font-medium font-data tabular-nums mt-1" dir="ltr">
                {tender.estimated_value != null
                  ? Number(tender.estimated_value).toLocaleString("ar-SA") + " ر.س"
                  : "غير محدد"}
              </dd>
            </div>
            <div>
              <dt className="text-overline text-muted-foreground">سعر العرض</dt>
              <dd className="text-foreground font-medium font-data tabular-nums mt-1" dir="ltr">
                {tender.proposed_price != null
                  ? Number(tender.proposed_price).toLocaleString("ar-SA") + " ر.س"
                  : "غير محدد"}
              </dd>
            </div>
            <div>
              <dt className="text-overline text-muted-foreground">الموعد النهائي</dt>
              <dd className="text-foreground font-medium mt-1">
                {new Date(tender.deadline).toLocaleDateString("ar-SA", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </dd>
            </div>
            <div>
              <dt className="text-overline text-muted-foreground">الحالة</dt>
              <dd className="text-foreground font-medium mt-1">
                {tender.status === "new"
                  ? "جديدة"
                  : tender.status === "evaluated"
                    ? "تم التقييم"
                    : tender.status === "costed"
                      ? "تم التسعير"
                      : "تم التصدير"}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Delete action */}
      <div className="pt-6 border-t border-border/40">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDelete}
          isLoading={deleting}
          className="text-confidence-low hover:text-confidence-low hover:bg-confidence-low/10"
        >
          <Trash2 className="h-4 w-4 ml-1" />
          حذف المنافسة
        </Button>
      </div>
    </div>
  );
}
