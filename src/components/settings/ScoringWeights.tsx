"use client";

import { useSettingsStore } from "@/stores/settings-store";
import { DEFAULT_SCORING_WEIGHTS } from "@/lib/constants";

const FIELDS: { key: keyof typeof DEFAULT_SCORING_WEIGHTS; labelAr: string }[] = [
  { key: "relevance", labelAr: "التوافق التقني" },
  { key: "budgetFit", labelAr: "الملاءمة المالية" },
  { key: "timeline", labelAr: "الجدول الزمني" },
  { key: "competition", labelAr: "مستوى المنافسة" },
  { key: "strategic", labelAr: "القيمة الاستراتيجية" },
];

export function ScoringWeights() {
  const { scoringWeights, setScoringWeights } = useSettingsStore();
  const sum = Object.values(scoringWeights).reduce((a, b) => a + b, 0);

  function handleChange(key: keyof typeof DEFAULT_SCORING_WEIGHTS, value: number) {
    const v = Math.max(0, Math.min(100, value));
    setScoringWeights({ [key]: v });
  }

  function handleReset() {
    setScoringWeights({ ...DEFAULT_SCORING_WEIGHTS });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">أوزان التقييم</h3>
        <button
          type="button"
          onClick={handleReset}
          className="rounded border border-border bg-muted px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted/80"
        >
          إعادة التعيين
        </button>
      </div>
      <p className="text-xs text-muted-foreground">
        توزيع معايير التقييم (المجموع 100). التحليل التالي سيستخدم هذه الأوزان.
      </p>
      <div className="space-y-3">
        {FIELDS.map(({ key, labelAr }) => (
          <div key={key} className="flex items-center gap-4">
            <label className="w-32 text-sm text-foreground">{labelAr}</label>
            <input
              type="number"
              min={0}
              max={100}
              value={scoringWeights[key]}
              onChange={(e) => handleChange(key, e.target.valueAsNumber || 0)}
              className="w-20 rounded border border-border bg-background px-2 py-1.5 text-sm text-foreground"
            />
            <span className="text-xs text-muted-foreground">%</span>
          </div>
        ))}
      </div>
      <p className={`text-xs ${sum === 100 ? "text-muted-foreground" : "text-amber-600"}`}>
        المجموع: {sum}% {sum !== 100 && "(يُفضّل أن يكون 100)"}
      </p>
    </div>
  );
}
