"use client";

import { useSettingsStore } from "@/stores/settings-store";

export function AIProviderConfig() {
  const { aiProvider, setAIProvider, geminiModel, groqModel } = useSettingsStore();

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-foreground">مزود الذكاء الاصطناعي</h3>
      <div className="flex gap-4">
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="radio"
            name="aiProvider"
            checked={aiProvider === "gemini"}
            onChange={() => setAIProvider("gemini")}
            className="rounded-full border-border text-primary focus:ring-primary"
          />
          <span className="text-sm text-foreground">Gemini</span>
          <span className="text-xs text-muted-foreground">({geminiModel})</span>
        </label>
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="radio"
            name="aiProvider"
            checked={aiProvider === "groq"}
            onChange={() => setAIProvider("groq")}
            className="rounded-full border-border text-primary focus:ring-primary"
          />
          <span className="text-sm text-foreground">Groq</span>
          <span className="text-xs text-muted-foreground">({groqModel})</span>
        </label>
      </div>
      <p className="text-xs text-muted-foreground">
        التحليل التالي سيستخدم {aiProvider === "gemini" ? "Gemini" : "Groq"}.
        الإعدادات تُحفظ تلقائياً.
      </p>
    </div>
  );
}
