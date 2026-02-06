"use client";

import { useSettingsStore } from "@/stores/settings-store";

/** Placeholder profile section. Full profile edit can be added later. */
export function ProfileForm() {
  const { locale, setLocale, tableView, setTableView } = useSettingsStore();

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-foreground">الملف الشخصي</h3>
      <div className="space-y-3">
        <div className="flex items-center gap-4">
          <label className="w-24 text-sm text-foreground">اللغة</label>
          <select
            value={locale}
            onChange={(e) => setLocale(e.target.value as "en" | "ar")}
            className="rounded border border-border bg-background px-3 py-1.5 text-sm text-foreground"
          >
            <option value="ar">العربية</option>
            <option value="en">English</option>
          </select>
        </div>
        <div className="flex items-center gap-4">
          <label className="w-24 text-sm text-foreground">عرض القائمة</label>
          <select
            value={tableView}
            onChange={(e) => setTableView(e.target.value as "table" | "card")}
            className="rounded border border-border bg-background px-3 py-1.5 text-sm text-foreground"
          >
            <option value="table">جدول</option>
            <option value="card">بطاقات</option>
          </select>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        الإعدادات تُحفظ تلقائياً في المتصفح.
      </p>
    </div>
  );
}
