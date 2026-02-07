"use client";

import Link from "next/link";

interface ExportSummaryProps {
  /** Count of tenders pushed to Odoo (from tenders.odoo_lead_id or exported_to). */
  pushedToOdoo: number;
}

/**
 * Dashboard card: export status. PRD: CRM = Excel + Odoo; no pipeline in nav.
 * Shows how many tenders were sent to Odoo; link to tenders list (not /pipeline).
 */
export function ExportSummary({ pushedToOdoo }: ExportSummaryProps) {
  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold text-foreground">التصدير إلى Odoo</h2>
        <Link
          href="/tenders"
          className="text-xs font-medium text-primary hover:underline"
        >
          عرض المنافسات ←
        </Link>
      </div>
      <div className="p-4 space-y-2">
        {pushedToOdoo === 0 ? (
          <p className="text-center text-sm text-muted-foreground">
            لم يُرسل أي منافسات إلى Odoo بعد.
          </p>
        ) : (
          <p className="text-center text-sm text-foreground">
            تم إرسال <strong>{pushedToOdoo}</strong> منافسة إلى Odoo.
          </p>
        )}
        <p className="text-center text-xs text-muted-foreground">
          للتصدير الجماعي أو الفردي، توجه إلى{" "}
          <Link href="/tenders" className="font-medium text-primary hover:underline">
            قائمة المنافسات
          </Link>
        </p>
      </div>
    </div>
  );
}
