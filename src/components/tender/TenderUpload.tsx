"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  parseCSV,
  parseExcel,
} from "@/lib/utils/csv-parser";
import { uploadTenders } from "@/app/actions/tenders";
import { PipelineStepper, type PipelineStep } from "./PipelineStepper";
import { processTenderPipeline, type PipelineResult } from "@/app/actions/pipeline";
import { toast } from "@/components/ui/toast";
import { MAX_FILE_SIZE_MB } from "@/lib/constants";
import Link from "next/link";

const MAX_CSV_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

interface TenderUploadProps {
  initialFile: File;
  onBack: () => void;
}

export function TenderUpload({ initialFile, onBack }: TenderUploadProps) {
  const router = useRouter();
  const [pipelineSteps, setPipelineSteps] = useState<PipelineStep[]>([]);
  const [pipelineRunning, setPipelineRunning] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [pipelineResult, setPipelineResult] = useState<PipelineResult | null>(null);

  const ext = initialFile.name.split(".").pop()?.toLowerCase();
  const isPdf = ext === "pdf";

  // ─── PDF auto-pipeline ───────────────────────────────────────────────────────
  const runAutoPipeline = useCallback(
    async (file: File) => {
      setPipelineRunning(true);
      setPipelineResult(null);
      setPipelineSteps([
        { label: "استخراج البيانات من PDF", status: "running" },
        { label: "حفظ المنافسة", status: "pending" },
        { label: "تقييم بالذكاء الاصطناعي", status: "pending" },
        { label: "الإرسال إلى Odoo", status: "pending" },
        { label: "النتائج", status: "pending" },
      ]);

      const formData = new FormData();
      formData.append("file", file);

      try {
        const result = await processTenderPipeline(formData);

        if (result.success && result.tenderId) {
          const timeStr = result.totalTimeMs
            ? `${(result.totalTimeMs / 1000).toFixed(1)} ث`
            : "تم";

          setPipelineSteps([
            {
              label: "استخراج البيانات من PDF",
              status: "done",
              detail: result.extraction?.processing_time_ms
                ? `${(result.extraction.processing_time_ms / 1000).toFixed(1)} ث`
                : "تم",
            },
            { label: "حفظ المنافسة", status: "done", detail: "تم" },
            {
              label: "تقييم بالذكاء الاصطناعي",
              status: result.evaluationId ? "done" : "error",
              detail: result.evaluationId ? "تم" : "تخطي",
            },
            {
              label: "الإرسال إلى Odoo",
              status: result.odooOpportunityId ? "done" : "error",
              detail: result.odooOpportunityId ? "تم" : "فشل",
            },
            { label: "النتائج", status: "done", detail: timeStr },
          ]);

          setPipelineResult(result);

          toast.success(
            result.extraction?.tender_title
              ? `تم معالجة "${result.extraction.tender_title}"`
              : "تم معالجة المنافسة بنجاح"
          );
        } else {
          const failStep = result.failedStep ?? "extract";
          const stepIdx =
            failStep === "extract" ? 0 : failStep === "save" ? 1 : failStep === "evaluate" ? 2 : 3;

          setPipelineSteps((prev) =>
            prev.map((s, i) =>
              i < stepIdx
                ? { ...s, status: "done" as const, detail: "تم" }
                : i === stepIdx
                  ? { ...s, status: "error" as const, detail: result.error }
                  : { ...s, status: "pending" as const, detail: undefined }
            )
          );

          setErrors([result.error ?? "فشل المعالجة"]);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setPipelineSteps((prev) => {
          const errorIdx = prev.findIndex(
            (s) => s.status === "running" || s.status === "pending"
          );
          return prev.map((s, i) =>
            i < errorIdx
              ? s
              : i === errorIdx
                ? { ...s, status: "error" as const, detail: msg }
                : { ...s, status: "pending" as const, detail: undefined }
          );
        });
        setErrors([msg]);
      } finally {
        setPipelineRunning(false);
      }
    },
    [router]
  );

  // ─── CSV / Excel auto-upload (no preview, no confirm) ───────────────────────
  const runCsvPipeline = useCallback(
    async (file: File) => {
      setPipelineRunning(true);
      setPipelineSteps([
        { label: "قراءة الملف", status: "running" },
        { label: "رفع المنافسات", status: "pending" },
        { label: "النتائج", status: "pending" },
      ]);

      if (file.size > MAX_CSV_BYTES) {
        setPipelineSteps([
          {
            label: "قراءة الملف",
            status: "error",
            detail: `الحجم يتجاوز ${MAX_FILE_SIZE_MB} MB`,
          },
          { label: "رفع المنافسات", status: "pending" },
          { label: "النتائج", status: "pending" },
        ]);
        setErrors([`حجم الملف يتجاوز الحد المسموح (${MAX_FILE_SIZE_MB} ميجابايت)`]);
        setPipelineRunning(false);
        return;
      }

      try {
        let parsed;
        if (ext === "csv") {
          const text = await file.text();
          parsed = parseCSV(text);
        } else {
          const buffer = await file.arrayBuffer();
          parsed = parseExcel(buffer);
        }

        if (parsed.valid.length === 0) {
          const errMsgs = parsed.errors.map((e) =>
            e.row > 0 ? `صف ${e.row}: ${e.message}` : e.message
          );
          setPipelineSteps([
            { label: "قراءة الملف", status: "error", detail: errMsgs[0] },
            { label: "رفع المنافسات", status: "pending" },
            { label: "النتائج", status: "pending" },
          ]);
          setErrors(errMsgs.length > 0 ? errMsgs : ["لا توجد بيانات صالحة في الملف"]);
          setPipelineRunning(false);
          return;
        }

        setPipelineSteps([
          { label: "قراءة الملف", status: "done", detail: `${parsed.valid.length} منافسة` },
          { label: "رفع المنافسات", status: "running" },
          { label: "النتائج", status: "pending" },
        ]);

        const result = await uploadTenders(parsed.valid);

        if (result.success) {
          const count = result.created;
          setPipelineSteps([
            { label: "قراءة الملف", status: "done", detail: `${parsed.valid.length} منافسة` },
            { label: "رفع المنافسات", status: "done", detail: `${count} مُضاف` },
            { label: "النتائج", status: "done", detail: "تم" },
          ]);
          toast.success(
            count === 1 ? "تم رفع منافسة واحدة بنجاح" : `تم رفع ${count} منافسة بنجاح`
          );
          setTimeout(() => {
            router.push("/tenders");
            router.refresh();
          }, 800);
        } else {
          setPipelineSteps([
            { label: "قراءة الملف", status: "done", detail: `${parsed.valid.length} منافسة` },
            { label: "رفع المنافسات", status: "error", detail: result.error },
            { label: "النتائج", status: "pending" },
          ]);
          setErrors([result.error]);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setPipelineSteps((prev) => {
          const errorIdx = prev.findIndex(
            (s) => s.status === "running" || s.status === "pending"
          );
          return prev.map((s, i) =>
            i < errorIdx
              ? s
              : i === errorIdx
                ? { ...s, status: "error" as const, detail: msg }
                : { ...s, status: "pending" as const, detail: undefined }
          );
        });
        setErrors([msg]);
      } finally {
        setPipelineRunning(false);
      }
    },
    [router, ext]
  );

  useEffect(() => {
    if (isPdf) {
      runAutoPipeline(initialFile);
    } else if (ext === "csv" || ext === "xlsx" || ext === "xls") {
      runCsvPipeline(initialFile);
    } else {
      setErrors(["نوع الملف غير مدعوم. استخدم PDF أو CSV أو Excel"]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialFile]);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-foreground">
          {isPdf ? "معالجة المنافسة" : "استيراد المنافسات"} — {initialFile.name}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {isPdf
            ? "استخراج تلقائي، حفظ، وتقييم بالذكاء الاصطناعي"
            : "قراءة الملف ورفع المنافسات تلقائياً"}
        </p>
      </div>

      <PipelineStepper steps={pipelineSteps} />

      {pipelineResult?.success && pipelineResult.evaluationDigest && (
        <div className="mt-8 rounded-xl border border-border/40 bg-card p-6 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-xl font-bold text-foreground">النتيجة الآلية للمنافسة</h4>
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              {pipelineResult.odooOpportunityId && (
                <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  فرصة Odoo: {pipelineResult.odooOpportunityId}
                </span>
              )}
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Recommendation */}
            <div className="rounded-lg bg-muted/50 p-4 border border-border/50">
              <span className="text-sm font-medium text-muted-foreground block mb-2">التوصية الآلية</span>
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <span className={`text-2xl font-bold ${(pipelineResult.evaluationDigest.auto_recommendation === 'pursue' || pipelineResult.evaluationDigest.auto_recommendation === 'proceed') ? 'text-green-600 dark:text-green-400' :
                    pipelineResult.evaluationDigest.auto_recommendation === 'review' ? 'text-yellow-600 dark:text-yellow-400' :
                      'text-red-600 dark:text-red-400'
                  }`}>
                  {(pipelineResult.evaluationDigest.auto_recommendation === 'pursue' || pipelineResult.evaluationDigest.auto_recommendation === 'proceed') ? 'متابعة (GO)' :
                    pipelineResult.evaluationDigest.auto_recommendation === 'review' ? 'تحتاج مراجعة (Review)' :
                      'تخطي (NO-GO)'}
                </span>
              </div>
            </div>

            {/* Score */}
            <div className="rounded-lg bg-muted/50 p-4 border border-border/50">
              <span className="text-sm font-medium text-muted-foreground block mb-2">التقييم من 100</span>
              <div className="text-2xl font-bold text-foreground">
                {pipelineResult.evaluationDigest.overall_score}%
              </div>
            </div>

            {/* Parametric Estimate */}
            <div className="rounded-lg bg-primary/5 p-4 border border-primary/20">
              <span className="text-sm font-medium text-primary block mb-2">التقدير المالي الأولي</span>
              {pipelineResult.evaluationDigest.parametric_estimate ? (
                <div className="text-xl font-bold text-primary">
                  {pipelineResult.evaluationDigest.parametric_estimate.estimated_min_value.toLocaleString()}
                  {" - "}
                  {pipelineResult.evaluationDigest.parametric_estimate.estimated_max_value.toLocaleString()} ر.س
                </div>
              ) : (
                <div className="text-xl font-bold text-muted-foreground">غير متاح</div>
              )}
            </div>
          </div>

          {pipelineResult.evaluationDigest.parametric_estimate?.estimation_rationale && (
            <div className="mt-4 rounded-lg bg-muted/30 p-4 border border-border/50 text-sm text-foreground/80 leading-relaxed font-mono whitespace-pre-wrap">
              <span className="block font-bold text-foreground mb-2">تبرير التقدير:</span>
              {pipelineResult.evaluationDigest.parametric_estimate.estimation_rationale}
            </div>
          )}

          <div className="mt-6 flex justify-end">
            <Link
              href={`/tenders/${pipelineResult.tenderId}/analysis`}
              className="inline-flex items-center rounded-lg bg-accent-500 px-6 py-3 border border-transparent text-sm font-medium text-white hover:bg-accent-400 transition-colors"
            >
              عرض نتائج التحليل
            </Link>
          </div>
        </div>
      )}

      {errors.length > 0 && !pipelineRunning && (
        <div className="rounded-md border border-destructive bg-destructive/10 p-4">
          <ul className="space-y-1 text-sm text-destructive">
            {errors.map((msg, i) => (
              <li key={i}>{msg}</li>
            ))}
          </ul>
          <button
            type="button"
            onClick={onBack}
            className="mt-3 rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            رجوع وإعادة المحاولة
          </button>
        </div>
      )}
    </div>
  );
}
