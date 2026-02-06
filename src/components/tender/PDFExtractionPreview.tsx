"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ExtractionResult } from "@/lib/ai/provider";
import { ConfidenceIndicator } from "./ConfidenceIndicator";
import { savePdfTender } from "@/app/actions/tenders";

interface PDFExtractionPreviewProps {
  extraction: ExtractionResult;
  fileName: string;
  onBack: () => void;
}

export function PDFExtractionPreview({
  extraction,
  fileName,
  onBack,
}: PDFExtractionPreviewProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [entity, setEntity] = useState(extraction.entity ?? "");
  const [tenderTitle, setTenderTitle] = useState(extraction.tender_title ?? "");
  const [tenderNumber, setTenderNumber] = useState(extraction.tender_number ?? "");
  const [deadline, setDeadline] = useState(extraction.deadline ?? "");
  const [estimatedValue, setEstimatedValue] = useState(
    extraction.estimated_value?.toString() ?? ""
  );
  const [description, setDescription] = useState(extraction.description ?? "");

  const [showEvidence, setShowEvidence] = useState(false);

  const missingFields = extraction.not_found ?? [];

  async function handleSave() {
    if (!entity || !tenderTitle || !tenderNumber || !deadline || !estimatedValue) {
      setError("يرجى تعبئة جميع الحقول المطلوبة");
      return;
    }

    const numVal = Number(estimatedValue);
    if (Number.isNaN(numVal) || numVal <= 0) {
      setError("القيمة التقديرية يجب أن تكون رقمًا موجبًا");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const result = await savePdfTender({
        entity,
        tender_title: tenderTitle,
        tender_number: tenderNumber,
        deadline,
        estimated_value: numVal,
        description: description || null,
        requirements: extraction.requirements ?? [],
        line_items: extraction.line_items ?? [],
        extraction_confidence: extraction.overall_confidence,
        extraction_warnings: extraction.warnings ?? [],
        source_file_name: fileName,
      });

      if (result.success) {
        router.push(`/tenders/${result.tenderId}`);
        router.refresh();
      } else {
        setError(result.error);
      }
    } catch {
      setError("حدث خطأ أثناء الحفظ");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">
          نتائج الاستخراج — {fileName}
        </h3>
        <ConfidenceIndicator score={extraction.overall_confidence ?? 0} size="md" />
      </div>

      {(extraction.warnings?.length ?? 0) > 0 && (
        <div className="rounded-md border border-amber-500/50 bg-amber-500/10 p-3 text-sm text-foreground">
          <p className="mb-1 font-medium">تنبيهات:</p>
          <ul className="list-inside list-disc space-y-0.5">
            {(extraction.warnings ?? []).map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {missingFields.length > 0 && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          <p className="mb-1 font-medium">حقول لم يتم العثور عليها:</p>
          <ul className="list-inside list-disc space-y-0.5">
            {missingFields.map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <FieldInput
          label="الجهة"
          value={entity}
          onChange={setEntity}
          confidence={extraction.confidence?.entity}
          evidence={extraction.evidence?.entity}
          required
        />
        <FieldInput
          label="عنوان المنافسة"
          value={tenderTitle}
          onChange={setTenderTitle}
          confidence={extraction.confidence?.tender_title}
          evidence={extraction.evidence?.tender_title}
          required
        />
        <FieldInput
          label="رقم المنافسة"
          value={tenderNumber}
          onChange={setTenderNumber}
          confidence={extraction.confidence?.tender_number}
          evidence={extraction.evidence?.tender_number}
          required
        />
        <FieldInput
          label="الموعد النهائي"
          value={deadline}
          onChange={setDeadline}
          confidence={extraction.confidence?.deadline}
          evidence={extraction.evidence?.deadline}
          required
          type="date"
        />
        <FieldInput
          label="القيمة التقديرية"
          value={estimatedValue}
          onChange={setEstimatedValue}
          confidence={extraction.confidence?.estimated_value}
          evidence={extraction.evidence?.estimated_value}
          required
          type="number"
        />
        <div className="sm:col-span-2">
          <FieldInput
            label="الوصف"
            value={description}
            onChange={setDescription}
            confidence={extraction.confidence?.description}
            evidence={extraction.evidence?.description}
            multiline
          />
        </div>
      </div>

      {(extraction.line_items?.length ?? 0) > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-foreground">
            بنود ({(extraction.line_items ?? []).length})
          </h4>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="px-3 py-2 text-start">الوصف</th>
                  <th className="px-3 py-2 text-start">الكمية</th>
                  <th className="px-3 py-2 text-start">الوحدة</th>
                  <th className="px-3 py-2 text-start">الثقة</th>
                </tr>
              </thead>
              <tbody>
                {(extraction.line_items ?? []).map((item, i) => (
                  <tr key={i} className="border-t border-border">
                    <td className="px-3 py-2">{item.description}</td>
                    <td className="px-3 py-2">{item.quantity ?? "—"}</td>
                    <td className="px-3 py-2">{item.unit ?? "—"}</td>
                    <td className="px-3 py-2">
                      <ConfidenceIndicator score={item.confidence ?? 0} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {extraction.evidence != null && Object.keys(extraction.evidence).length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => setShowEvidence(!showEvidence)}
            className="text-sm font-medium text-primary hover:underline"
          >
            {showEvidence ? "إخفاء الاستشهادات" : "عرض الاستشهادات من المستند"}
          </button>
          {showEvidence && (
            <div className="mt-2 space-y-2 rounded-md border border-border bg-muted/50 p-3">
              {Object.entries(extraction.evidence ?? {})
                .filter(([, v]) => v != null)
                .map(([key, value]) => (
                  <div key={key} className="text-sm">
                    <span className="font-medium text-muted-foreground">
                      {key}:
                    </span>{" "}
                    <span className="text-foreground">&ldquo;{value}&rdquo;</span>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        تنويه: تم استخراج هذه البيانات بواسطة الذكاء الاصطناعي ({extraction.model_used ?? "—"}).
        يُرجى مراجعة الحقول والتأكد من صحتها قبل الحفظ.
        {extraction.processing_time_ms != null && (
          <> — وقت المعالجة: {(extraction.processing_time_ms / 1000).toFixed(1)} ثانية</>
        )}
      </p>

      {error && (
        <div
          role="alert"
          className="rounded-md bg-destructive/10 p-3 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          رجوع
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-gold-600 disabled:opacity-50"
        >
          {saving ? "جارٍ الحفظ..." : "حفظ المنافسة"}
        </button>
      </div>
    </div>
  );
}

function FieldInput({
  label,
  value,
  onChange,
  confidence,
  evidence,
  required,
  type = "text",
  multiline,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  confidence?: number;
  evidence?: string | null;
  required?: boolean;
  type?: string;
  multiline?: boolean;
}) {
  const inputClasses =
    "w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary";

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-foreground">
          {label}
          {required && <span className="text-destructive">*</span>}
        </label>
        {confidence != null && <ConfidenceIndicator score={confidence} />}
      </div>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className={inputClasses}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={inputClasses}
        />
      )}
      {evidence && (
        <p className="text-xs text-muted-foreground" dir="auto">
          &ldquo;{evidence}&rdquo;
        </p>
      )}
    </div>
  );
}
