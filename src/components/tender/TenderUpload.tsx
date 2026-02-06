"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  parseCSV,
  parseExcel,
  type ParsedTender,
} from "@/lib/utils/csv-parser";
import { uploadTenders } from "@/app/actions/tenders";

const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export function TenderUpload() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ParsedTender[]>([]);
  const [errors, setErrors] = useState<{ row: number; message: string }[]>([]);
  const [uploading, setUploading] = useState(false);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (selectedFile.size > MAX_FILE_SIZE_BYTES) {
      setErrors([
        {
          row: 0,
          message: `حجم الملف يتجاوز الحد المسموح (${MAX_FILE_SIZE_MB} ميجابايت)`,
        },
      ]);
      setFile(null);
      setPreview([]);
      return;
    }

    setFile(selectedFile);
    setErrors([]);
    setPreview([]);

    try {
      const ext = selectedFile.name.split(".").pop()?.toLowerCase();

      if (ext === "csv") {
        const text = await selectedFile.text();
        const result = parseCSV(text);
        setPreview(result.valid);
        setErrors(result.errors);
      } else if (ext === "xlsx" || ext === "xls") {
        const buffer = await selectedFile.arrayBuffer();
        const result = parseExcel(buffer);
        setPreview(result.valid);
        setErrors(result.errors);
      } else {
        setErrors([
          {
            row: 0,
            message: "نوع الملف غير مدعوم. استخدم CSV أو Excel",
          },
        ]);
      }
    } catch (err) {
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
        alert(msg);
        setFile(null);
        setPreview([]);
        setErrors([]);
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

  return (
    <div className="space-y-6">
      <div className="rounded-lg border-2 border-dashed border-border p-8 text-center transition-colors hover:border-gold-500">
        <input
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={handleFileChange}
          className="hidden"
          id="file-upload"
        />
        <label htmlFor="file-upload" className="block cursor-pointer">
          <div className="mb-2 text-muted-foreground">
            {file ? file.name : "اسحب ملف CSV أو Excel هنا أو انقر للاختيار"}
          </div>
          <div className="text-sm text-muted-foreground">
            الحد الأقصى: {MAX_FILE_SIZE_MB} ميجابايت
          </div>
        </label>
      </div>

      {errors.length > 0 && (
        <div className="rounded-md border border-destructive bg-destructive/10 p-4">
          <h3 className="mb-2 font-semibold text-destructive">
            أخطاء في الملف:
          </h3>
          <ul className="space-y-1 text-sm">
            {errors.map((err, i) => (
              <li key={i}>
                صف {err.row}: {err.message}
              </li>
            ))}
          </ul>
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
                      {tender.estimated_value.toLocaleString("ar-SA")}
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

          <button
            type="button"
            onClick={handleUpload}
            disabled={uploading}
            className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-gold-600 disabled:opacity-50"
          >
            {uploading ? "جارٍ الرفع..." : `رفع ${preview.length} منافسة`}
          </button>
        </div>
      )}
    </div>
  );
}
