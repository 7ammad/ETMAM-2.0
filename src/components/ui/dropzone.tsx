"use client";

import { useCallback, useState } from "react";
import { Upload, FileText, X, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface DropzoneProps {
  accept?: Record<string, string[]>;
  maxSize?: number;
  maxFiles?: number;
  onFilesSelected: (files: File[]) => void;
  label?: string;
  hint?: string;
  className?: string;
  disabled?: boolean;
}

function Dropzone({
  accept,
  maxSize = 20 * 1024 * 1024, // 20MB
  maxFiles = 1,
  onFilesSelected,
  label = "اسحب الملفات هنا أو اضغط للاختيار",
  hint,
  className,
  disabled,
}: DropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);

  const validateFiles = useCallback(
    (incoming: File[]): File[] => {
      setError(null);
      const valid: File[] = [];

      for (const file of incoming) {
        if (file.size > maxSize) {
          setError(`حجم الملف ${file.name} يتجاوز الحد الأقصى`);
          continue;
        }
        if (accept) {
          const ext = "." + file.name.split(".").pop()?.toLowerCase();
          const acceptedExts = Object.values(accept).flat();
          const acceptedTypes = Object.keys(accept);
          const typeMatch = acceptedTypes.some(
            (t) => file.type === t || (t.endsWith("/*") && file.type.startsWith(t.replace("/*", "/")))
          );
          if (!typeMatch && !acceptedExts.includes(ext)) {
            setError(`نوع الملف ${file.name} غير مدعوم`);
            continue;
          }
        }
        valid.push(file);
      }

      return valid.slice(0, maxFiles);
    },
    [accept, maxSize, maxFiles]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      if (disabled) return;

      const droppedFiles = Array.from(e.dataTransfer.files);
      const valid = validateFiles(droppedFiles);
      if (valid.length) {
        setFiles(valid);
        onFilesSelected(valid);
      }
    },
    [disabled, validateFiles, onFilesSelected]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = Array.from(e.target.files || []);
      const valid = validateFiles(selected);
      if (valid.length) {
        setFiles(valid);
        onFilesSelected(valid);
      }
      e.target.value = "";
    },
    [validateFiles, onFilesSelected]
  );

  const removeFile = (index: number) => {
    const next = files.filter((_, i) => i !== index);
    setFiles(next);
    onFilesSelected(next);
  };

  const acceptStr = accept
    ? Object.values(accept).flat().join(",")
    : undefined;

  return (
    <div className={cn("space-y-2", className)}>
      <label
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        className={cn(
          "flex flex-col items-center justify-center gap-3 p-8 rounded-lg border-2 border-dashed cursor-pointer",
          "transition-all duration-200",
          isDragOver
            ? "border-gold-500 bg-gold-500/5"
            : "border-navy-600 hover:border-navy-500 bg-navy-900/50",
          disabled && "opacity-50 cursor-not-allowed",
          error && "border-confidence-low/50"
        )}
      >
        <input
          type="file"
          className="sr-only"
          accept={acceptStr}
          multiple={maxFiles > 1}
          onChange={handleFileInput}
          disabled={disabled}
        />
        <div
          className={cn(
            "p-3 rounded-full",
            isDragOver ? "bg-gold-500/10" : "bg-navy-800"
          )}
        >
          <Upload
            className={cn(
              "h-6 w-6",
              isDragOver ? "text-gold-500" : "text-navy-400"
            )}
          />
        </div>
        <div className="text-center">
          <p className="text-sm text-navy-200">{label}</p>
          {hint && (
            <p className="text-xs text-muted-foreground mt-1">{hint}</p>
          )}
        </div>
      </label>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 text-xs text-confidence-low">
          <AlertCircle className="h-3.5 w-3.5" />
          {error}
        </div>
      )}

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-1">
          {files.map((file, i) => (
            <div
              key={`${file.name}-${i}`}
              className="flex items-center gap-2 rounded-md bg-navy-800 border border-navy-700 p-2 text-sm"
            >
              <FileText className="h-4 w-4 text-navy-400 shrink-0" />
              <span className="flex-1 truncate text-navy-200">{file.name}</span>
              <span className="text-xs text-muted-foreground ltr-nums">
                {(file.size / 1024).toFixed(0)} KB
              </span>
              <button
                onClick={() => removeFile(i)}
                className="p-0.5 rounded hover:bg-navy-700 text-navy-400 hover:text-navy-200 transition-colors"
                aria-label="إزالة الملف"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export { Dropzone };
export type { DropzoneProps };
