"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ExtractionResult } from "@/lib/ai/provider";
import { ConfidenceIndicator } from "./ConfidenceIndicator";
import { savePdfTender } from "@/app/actions/tenders";
import { Button, Input, Textarea } from "@/components/ui";

interface PDFExtractionPreviewProps {
  extraction: ExtractionResult;
  fileName: string;
  onBack: () => void;
}

const FIELD_LABELS: Record<string, string> = {
  entity: "الجهة",
  tender_title: "عنوان المنافسة",
  tender_number: "رقم المنافسة",
  deadline: "الموعد النهائي",
  estimated_value: "القيمة التقديرية",
  description: "الوصف",
};

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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const REQUIRED_KEYS = ["entity", "tender_title", "tender_number", "deadline"];
  const allMissingFields = extraction.not_found ?? [];
  const missingRequiredFields = allMissingFields.filter((f) => REQUIRED_KEYS.includes(f));
  const emptyRequiredCount = [entity, tenderTitle, tenderNumber, deadline].filter(
    (v) => !v.trim()
  ).length;
  const hasPartialExtraction = emptyRequiredCount >= 2 || missingRequiredFields.length >= 2;

  function clearFieldError(field: string) {
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }

  async function handleSave() {
    const errors: Record<string, string> = {};
    if (!entity.trim()) errors.entity = "الجهة مطلوبة";
    if (!tenderTitle.trim()) errors.tender_title = "عنوان المنافسة مطلوب";
    if (!tenderNumber.trim()) errors.tender_number = "رقم المنافسة مطلوب";
    if (!deadline.trim()) errors.deadline = "الموعد النهائي مطلوب";

    let numVal: number | null = null;
    if (estimatedValue.trim()) {
      numVal = Number(estimatedValue);
      if (Number.isNaN(numVal) || numVal <= 0) {
        errors.estimated_value = "يجب أن تكون رقمًا موجبًا";
      }
    }

    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      const names = Object.keys(errors).map((k) => FIELD_LABELS[k] ?? k);
      setError(`حقول ناقصة: ${names.join("، ")}`);
      return;
    }

    setError(null);
    setSaving(true);

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
        extracted_sections: (extraction.extracted_sections as unknown as Record<string, unknown>) ?? null,
        extraction_confidence: extraction.overall_confidence ?? 0,
        extraction_warnings: extraction.warnings ?? [],
        source_file_name: fileName,
      });

      if (result.success) {
        router.push("/tenders");
        router.refresh();
      } else {
        setError(result.error);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError("حدث خطأ أثناء الحفظ: " + message);
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

      {hasPartialExtraction && (
        <div className="rounded-md border border-blue-500/50 bg-blue-500/10 p-3 text-sm text-foreground">
          <p className="mb-1 font-medium">استخراج جزئي</p>
          <p>
            لم يتمكن الذكاء الاصطناعي من استخراج بعض الحقول المطلوبة.
            يُرجى تعبئة الحقول المؤشرة بـ <span className="text-destructive font-medium">*</span> يدويًا
            من كراسة الشروط قبل الحفظ.
          </p>
        </div>
      )}

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

      {missingRequiredFields.length > 0 && !hasPartialExtraction && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          <p className="mb-1 font-medium">حقول مطلوبة لم يتم العثور عليها:</p>
          <ul className="list-inside list-disc space-y-0.5">
            {missingRequiredFields.map((f, i) => (
              <li key={i}>{FIELD_LABELS[f] ?? f}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <FieldInput
          label="الجهة"
          value={entity}
          onChange={(v) => { setEntity(v); clearFieldError("entity"); }}
          confidence={extraction.confidence?.entity}
          evidence={extraction.evidence?.entity}
          required
          error={fieldErrors.entity}
          placeholder={!extraction.entity ? "لم يُستخرج — أدخل يدويًا" : undefined}
        />
        <FieldInput
          label="عنوان المنافسة"
          value={tenderTitle}
          onChange={(v) => { setTenderTitle(v); clearFieldError("tender_title"); }}
          confidence={extraction.confidence?.tender_title}
          evidence={extraction.evidence?.tender_title}
          required
          error={fieldErrors.tender_title}
          placeholder={!extraction.tender_title ? "لم يُستخرج — أدخل يدويًا" : undefined}
        />
        <FieldInput
          label="رقم المنافسة"
          value={tenderNumber}
          onChange={(v) => { setTenderNumber(v); clearFieldError("tender_number"); }}
          confidence={extraction.confidence?.tender_number}
          evidence={extraction.evidence?.tender_number}
          required
          error={fieldErrors.tender_number}
          placeholder={!extraction.tender_number ? "لم يُستخرج — أدخل يدويًا" : undefined}
        />
        <FieldInput
          label="الموعد النهائي"
          value={deadline}
          onChange={(v) => { setDeadline(v); clearFieldError("deadline"); }}
          confidence={extraction.confidence?.deadline}
          evidence={extraction.evidence?.deadline}
          required
          error={fieldErrors.deadline}
          type="date"
          placeholder={!extraction.deadline ? "لم يُستخرج — أدخل يدويًا" : undefined}
        />
        <FieldInput
          label="القيمة التقديرية (اختياري)"
          value={estimatedValue}
          onChange={(v) => { setEstimatedValue(v); clearFieldError("estimated_value"); }}
          evidence={extraction.evidence?.estimated_value}
          type="number"
          error={fieldErrors.estimated_value}
          placeholder="غالباً غير متوفر في كراسة الشروط"
        />
        <div className="sm:col-span-2">
          <FieldInput
            label="الوصف"
            value={description}
            onChange={setDescription}
            confidence={extraction.confidence?.description}
            multiline
          />
        </div>
      </div>

      {(() => {
        // Show BOQ items from extracted_sections (preferred) or fallback to flat line_items
        const sections = extraction.extracted_sections as { boq?: { items?: { seq: number; description: string; quantity: number | null; unit: string | null; confidence: number; category?: string | null }[]; pricing_type?: string | null } | null } | null | undefined;
        const boqItems = sections?.boq?.items ?? [];
        const displayItems = boqItems.length > 0
          ? boqItems.map((b) => ({ description: b.description, quantity: b.quantity, unit: b.unit, confidence: b.confidence, category: b.category ?? null }))
          : (extraction.line_items ?? []).map((li) => ({ ...li, category: null as string | null }));
        if (displayItems.length === 0) return null;
        const hasCategory = displayItems.some((it) => it.category);
        return (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-foreground">
              بنود جدول الكميات ({displayItems.length})
              {sections?.boq?.pricing_type && (
                <span className="mr-2 text-xs text-muted-foreground">
                  — {sections.boq.pricing_type === "lump_sum" ? "مقطوعية" : sections.boq.pricing_type === "unit_based" ? "بالوحدة" : "مختلط"}
                </span>
              )}
            </h4>
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-3 py-2 text-start">الوصف</th>
                    {hasCategory && <th className="px-3 py-2 text-start">الفئة</th>}
                    <th className="px-3 py-2 text-start">الكمية</th>
                    <th className="px-3 py-2 text-start">الوحدة</th>
                    <th className="px-3 py-2 text-start">الثقة</th>
                  </tr>
                </thead>
                <tbody>
                  {displayItems.map((item, i) => (
                    <tr key={i} className="border-t border-border">
                      <td className="px-3 py-2">{item.description}</td>
                      {hasCategory && <td className="px-3 py-2 text-muted-foreground">{item.category ?? "—"}</td>}
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
        );
      })()}

      {extraction.evidence != null && Object.keys(extraction.evidence).length > 0 && (
        <div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowEvidence(!showEvidence)}
          >
            {showEvidence ? "إخفاء الاستشهادات" : "عرض الاستشهادات من المستند"}
          </Button>
          {showEvidence && (
            <div className="mt-2 space-y-2 rounded-md border border-border bg-muted/50 p-3">
              {Object.entries(extraction.evidence ?? {})
                .filter(([, v]) => v != null)
                .map(([key, value]) => (
                  <div key={key} className="text-sm">
                    <span className="font-medium text-muted-foreground">
                      {FIELD_LABELS[key] ?? key}:
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
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
        >
          رجوع
        </Button>
        <Button
          type="button"
          onClick={handleSave}
          disabled={saving}
          isLoading={saving}
          className="flex-1"
        >
          {saving ? "جارٍ الحفظ..." : "حفظ المنافسة"}
        </Button>
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
  placeholder,
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  confidence?: number;
  evidence?: string | null;
  required?: boolean;
  type?: string;
  multiline?: boolean;
  placeholder?: string;
  error?: string;
}) {
  const hasError = Boolean(error);
  const isEmpty = required && !value.trim();
  const conditionalClass = isEmpty && !hasError
    ? "border-amber-500/50"
    : "";

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
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          error={hasError}
          className={conditionalClass}
          placeholder={placeholder}
        />
      ) : (
        <Input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          error={hasError}
          className={conditionalClass}
          placeholder={placeholder}
        />
      )}
      {hasError && (
        <p className="text-xs text-destructive">{error}</p>
      )}
      {evidence && (
        <p className="text-xs text-muted-foreground" dir="auto">
          &ldquo;{evidence}&rdquo;
        </p>
      )}
    </div>
  );
}
