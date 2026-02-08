"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  parseCSV,
  parseExcel,
  type ParsedTender,
} from "@/lib/utils/csv-parser";
import { uploadTenders } from "@/app/actions/tenders";
import type { ExtractionResult } from "@/lib/ai/provider";
import { PDFExtractionPreview } from "./PDFExtractionPreview";
import { toast } from "@/components/ui/toast";
import {
  MAX_FILE_SIZE_MB,
  MAX_PDF_SIZE_MB,
} from "@/lib/constants";

const MAX_CSV_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const MAX_PDF_BYTES = MAX_PDF_SIZE_MB * 1024 * 1024;

interface TenderUploadProps {
  initialFile: File;
  onBack: () => void;
}

export function TenderUpload({ initialFile, onBack }: TenderUploadProps) {
  const router = useRouter();
  const [preview, setPreview] = useState<ParsedTender[]>([]);
  const [errors, setErrors] = useState<{ row: number; message: string }[]>([]);
  const [uploading, setUploading] = useState(false);

  // PDF extraction state
  const [extracting, setExtracting] = useState(false);
  const [extraction, setExtraction] = useState<ExtractionResult | null>(null);

  useEffect(() => {
    processFile(initialFile);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialFile]);

  async function processFile(file: File) {
    const ext = file.name.split(".").pop()?.toLowerCase();
    const isPdf = ext === "pdf";
    const maxBytes = isPdf ? MAX_PDF_BYTES : MAX_CSV_BYTES;
    const maxMB = isPdf ? MAX_PDF_SIZE_MB : MAX_FILE_SIZE_MB;

    if (file.size > maxBytes) {
      setErrors([
        {
          row: 0,
          message: `حجم الملف يتجاوز الحد المسموح (${maxMB} ميجابايت)`,
        },
      ]);
      return;
    }

    setErrors([]);
    setPreview([]);
    setExtraction(null);

    try {
      if (isPdf) {
        setExtracting(true);

        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/ai/extract", {
          method: "POST",
          body: formData,
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          setErrors([{ row: 0, message: data.error ?? "فشل استخراج البيانات" }]);
        } else {
          setExtraction(data.extraction as ExtractionResult);
        }

        setExtracting(false);
      } else if (ext === "csv") {
        const text = await file.text();
        const result = parseCSV(text);
        setPreview(result.valid);
        setErrors(result.errors);
      } else if (ext === "xlsx" || ext === "xls") {
        const buffer = await file.arrayBuffer();
        const result = parseExcel(buffer);
        setPreview(result.valid);
        setErrors(result.errors);
      } else {
        setErrors([
          {
            row: 0,
            message: "نوع الملف غير مدعوم. استخدم CSV أو Excel أو PDF",
          },
        ]);
      }
    } catch (err) {
      setExtracting(false);
      setErrors([
        {
          row: 0,
          message: "فشل تحليل الملف: " + (err as Error).message,
        },
      ]);
    }
  }

  async function handleUpload() {
    if (preview.length === 0) return;

    setUploading(true);
    try {
      const result = await uploadTenders(preview);

      if (result.success) {
        const count = result.created;
        const msg =
          count === 1
            ? "تم رفع منافسة واحدة بنجاح"
            : `تم رفع ${count} منافسة بنجاح`;
        toast.success(msg);
        onBack();
        router.push("/tenders");
        router.refresh();
      } else {
        setErrors([{ row: 0, message: result.error }]);
      }
    } catch {
      setErrors([{ row: 0, message: "حدث خطأ أثناء الرفع" }]);
    } finally {
      setUploading(false);
    }
  }

  // Show PDF extraction preview
  if (extraction) {
    return (
      <PDFExtractionPreview
        extraction={extraction}
        fileName={initialFile.name}
        onBack={onBack}
      />
    );
  }

  return (
    <div className="space-y-6">
      {extracting && (
        <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          جارٍ استخراج البيانات بالذكاء الاصطناعي — {initialFile.name}
        </div>
      )}

      {errors.length > 0 && (
        <div className="rounded-md border border-destructive bg-destructive/10 p-4">
          <h3 className="mb-2 font-semibold text-destructive">
            أخطاء في الملف:
          </h3>
          <ul className="space-y-1 text-sm">
            {errors.map((err, i) => (
              <li key={i}>
                {err.row > 0 ? `صف ${err.row}: ` : ""}
                {err.message}
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={onBack}
            className="mt-3 rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            رجوع
          </button>
        </div>
      )}

      {preview.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">
            معاينة ({preview.length} منافسة)
          </h3>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-2 text-start">الجهة</th>
                  <th className="px-4 py-2 text-start">عنوان المنافسة</th>
                  <th className="px-4 py-2 text-start">رقم المنافسة</th>
                  <th className="px-4 py-2 text-start">الموعد النهائي</th>
                  <th className="px-4 py-2 text-start">القيمة التقديرية</th>
                </tr>
              </thead>
              <tbody>
                {preview.slice(0, 5).map((tender, i) => (
                  <tr key={i} className="border-t border-border">
                    <td className="px-4 py-2">{tender.entity}</td>
                    <td className="px-4 py-2">{tender.tender_title}</td>
                    <td className="px-4 py-2">{tender.tender_number}</td>
                    <td className="px-4 py-2">{tender.deadline}</td>
                    <td className="px-4 py-2" dir="ltr">
                      {tender.estimated_value != null ? Number(tender.estimated_value).toLocaleString("ar-SA") : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {preview.length > 5 && (
              <div className="bg-muted px-4 py-2 text-sm text-muted-foreground">
                + {preview.length - 5} منافسة أخرى
              </div>
            )}
          </div>

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
              onClick={handleUpload}
              disabled={uploading}
              className="flex-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-gold-600 disabled:opacity-50"
            >
              {uploading ? "جارٍ الرفع..." : `رفع ${preview.length} منافسة`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
