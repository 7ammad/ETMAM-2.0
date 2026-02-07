"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { exportTenderToExcel, pushTenderToOdoo } from "@/app/actions/export";
import { Download, Send } from "lucide-react";

interface ExportTabProps {
  tenderId: string;
}

export function ExportTab({ tenderId }: ExportTabProps) {
  const [excelLoading, setExcelLoading] = useState(false);
  const [odooLoading, setOdooLoading] = useState(false);
  const [excelError, setExcelError] = useState<string | null>(null);
  const [odooError, setOdooError] = useState<string | null>(null);
  const [odooSuccess, setOdooSuccess] = useState<string | null>(null);

  async function handleDownloadExcel() {
    setExcelError(null);
    setExcelLoading(true);
    try {
      const result = await exportTenderToExcel(tenderId);
      if (!result.success) {
        setExcelError(result.error);
        return;
      }
      const bin = atob(result.base64);
      const buf = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
      const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = result.filename;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExcelLoading(false);
    }
  }

  async function handlePushToOdoo() {
    setOdooError(null);
    setOdooSuccess(null);
    setOdooLoading(true);
    try {
      const result = await pushTenderToOdoo(tenderId);
      if (!result.success) {
        setOdooError(result.error);
        return;
      }
      setOdooSuccess(`تم إرسال المنافسة إلى Odoo بنجاح. رقم الفرصة: ${result.odoo_lead_id}`);
    } finally {
      setOdooLoading(false);
    }
  }

  return (
    <div className="space-y-8" dir="rtl">
      {/* Excel */}
      <section className="rounded-md border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-foreground">تصدير Excel</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          تحميل ملف Excel يحتوي على بيانات المنافسة، التقييم، والتكاليف (3 أوراق).
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button
            variant="primary"
            onClick={handleDownloadExcel}
            disabled={excelLoading}
            isLoading={excelLoading}
            rightIcon={!excelLoading ? <Download className="size-4" /> : undefined}
          >
            {excelLoading ? "جاري التصدير..." : "تحميل Excel"}
          </Button>
          {excelError && (
            <span className="text-sm text-destructive" role="alert">
              {excelError}
            </span>
          )}
        </div>
      </section>

      {/* Odoo */}
      <section className="rounded-md border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-foreground">إرسال إلى Odoo CRM</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          إرسال المنافسة كفرصة في Odoo (الجهة، العنوان، الموعد، القيمة، التوصية، سعر العرض).
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button
            variant="primary"
            onClick={handlePushToOdoo}
            disabled={odooLoading}
            isLoading={odooLoading}
            rightIcon={!odooLoading ? <Send className="size-4" /> : undefined}
          >
            {odooLoading ? "جاري الإرسال..." : "إرسال إلى Odoo"}
          </Button>
          {odooSuccess && (
            <span className="text-sm text-green-600 dark:text-green-400" role="status">
              {odooSuccess}
            </span>
          )}
          {odooError && (
            <span className="text-sm text-destructive" role="alert">
              {odooError}
            </span>
          )}
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          إذا لم يتم إعداد Odoo، اذهب إلى{" "}
          <Link href="/settings" className="text-primary underline underline-offset-2">
            الإعدادات → ربط Odoo/CRM
          </Link>{" "}
          وأدخل الرابط، قاعدة البيانات، اسم المستخدم، ومفتاح API.
        </p>
      </section>
    </div>
  );
}
