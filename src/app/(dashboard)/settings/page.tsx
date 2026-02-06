import { SettingsTabs } from "@/components/settings/SettingsTabs";

export default function SettingsPage() {
  return (
    <main className="p-6">
      <h1 className="mb-6 text-2xl font-bold text-foreground">الإعدادات</h1>
      <SettingsTabs />
    </main>
  );
}
