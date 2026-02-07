"use client";

import { useSettingsStore } from "@/stores/settings-store";

const PROVIDER_LABELS: Record<"deepseek" | "gemini" | "groq", string> = {
  deepseek: "DeepSeek",
  gemini: "Gemini",
  groq: "Groq",
};

export function AIProviderConfig() {
  const { aiProvider, setAIProvider, deepseekModel, geminiModel, groqModel } = useSettingsStore();
  const modelByProvider = { deepseek: deepseekModel, gemini: geminiModel, groq: groqModel };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-foreground">مزود الذكاء الاصطناعي</h3>
      <div className="flex flex-wrap gap-4">
        {(["deepseek", "gemini", "groq"] as const).map((id) => (
          <label key={id} className="flex cursor-pointer items-center gap-2">
            <input
              type="radio"
              name="aiProvider"
              checked={aiProvider === id}
              onChange={() => setAIProvider(id)}
              className="rounded-full border-border text-primary focus:ring-primary"
            />
            <span className="text-sm text-foreground">{PROVIDER_LABELS[id]}</span>
            <span className="text-xs text-muted-foreground">({modelByProvider[id]})</span>
          </label>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        التحليل التالي سيستخدم {PROVIDER_LABELS[aiProvider]}. استخراج PDF يستخدم Gemini فقط.
        الإعدادات تُحفظ تلقائياً.
      </p>
    </div>
  );
}
