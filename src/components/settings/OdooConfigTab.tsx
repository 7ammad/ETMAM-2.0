"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { getOdooConfig, testOdooConnection, type OdooConfigStatus } from "@/app/actions/odoo";

export function OdooConfigTab() {
  const [config, setConfig] = useState<OdooConfigStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ url: "", db: "", username: "", api_key: "" });
  const [testing, setTesting] = useState(false);
  const [testMessage, setTestMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    (async () => {
      const result = await getOdooConfig();
      setLoading(false);
      if (result.success) {
        setConfig(result.config);
        setForm((f) => ({
          ...f,
          url: result.config.url,
          db: result.config.db,
          username: result.config.username,
        }));
      }
    })();
  }, []);

  async function handleTest() {
    setTestMessage(null);
    setTesting(true);
    const result = await testOdooConnection({
      url: form.url || undefined,
      db: form.db || undefined,
      username: form.username || undefined,
      api_key: form.api_key || undefined,
    });
    setTesting(false);
    if (result.success) {
      if (result.connected) {
        setTestMessage({ type: "success", text: "تم الاتصال بـ Odoo بنجاح." });
      } else {
        setTestMessage({ type: "error", text: result.error ?? "فشل الاتصال" });
      }
    } else {
      setTestMessage({ type: "error", text: result.error });
    }
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">جاري التحميل...</p>;
  }

  return (
    <div className="space-y-6" dir="rtl">
      <p className="text-xs text-muted-foreground">
        الإعدادات تُقرأ من متغيرات البيئة (ODOO_URL, ODOO_DB, ODOO_USERNAME, ODOO_API_KEY). للتشغيل في الإنتاج،
        اضبطها في ملف .env. يمكنك أدناه تعبئة القيم واختبار الاتصال.
      </p>

      <div className="grid gap-4 max-w-xl">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">رابط Odoo (ODOO_URL)</label>
          <input
            type="url"
            value={form.url}
            onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
            placeholder="https://company.odoo.com"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">قاعدة البيانات (ODOO_DB)</label>
          <input
            type="text"
            value={form.db}
            onChange={(e) => setForm((f) => ({ ...f, db: e.target.value }))}
            placeholder="company_database"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">اسم المستخدم (ODOO_USERNAME)</label>
          <input
            type="text"
            value={form.username}
            onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
            placeholder="user@company.com"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">مفتاح API (ODOO_API_KEY)</label>
          <input
            type="password"
            value={form.api_key}
            onChange={(e) => setForm((f) => ({ ...f, api_key: e.target.value }))}
            placeholder={config?.hasApiKey ? "•••••••• (معرّف في .env)" : "أدخل المفتاح أو اضبطه في .env"}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
            autoComplete="off"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={handleTest} disabled={testing} isLoading={testing}>
            اختبار الاتصال
          </Button>
        </div>

        {testMessage && (
          <div
            role="alert"
            className={`rounded-md border px-3 py-2 text-sm ${
              testMessage.type === "success"
                ? "border-green-600/50 bg-green-500/10 text-green-800 dark:text-green-200"
                : "border-red-600/50 bg-red-500/10 text-red-800 dark:text-red-200"
            }`}
          >
            {testMessage.text}
          </div>
        )}
      </div>
    </div>
  );
}
