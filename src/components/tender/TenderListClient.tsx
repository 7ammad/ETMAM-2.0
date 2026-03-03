"use client";

import { useState, useMemo, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import type { Tender } from "@/types/database";
import { ScoreBadge } from "@/components/ui";
import { TenderUpload } from "./TenderUpload";
import { useLanguageStore } from "@/stores/language-store";
import { t, ts } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import { pushQualifiedTendersToOdoo } from "@/app/actions/export";
import { deleteTender } from "@/app/actions/tenders";

interface TenderListClientProps {
  initialTenders: Tender[];
}

const STATUS_KEYS: Record<string, "statusNew" | "statusEvaluated" | "statusCosted" | "statusExported"> = {
  new: "statusNew",
  evaluated: "statusEvaluated",
  costed: "statusCosted",
  exported: "statusExported",
};

const STATUS_STYLES: Record<string, string> = {
  new: "bg-status-draft/20 text-status-draft",
  evaluated: "bg-status-scored/20 text-status-scored",
  costed: "bg-status-active/20 text-status-active",
  exported: "bg-status-pushed/20 text-status-pushed",
};

function StatusBadge({ status, lang }: { status: string; lang: Lang }) {
  const key = STATUS_KEYS[status];
  const label = key ? ts(key, lang) : status;
  return (
    <span
      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${STATUS_STYLES[status] ?? "bg-muted text-muted-foreground"}`}
    >
      {label}
    </span>
  );
}

export function TenderListClient({ initialTenders }: TenderListClientProps) {
  const router = useRouter();
  const lang = useLanguageStore((s) => s.lang);
  const [tenders] = useState(initialTenders);
  const [sortBy, setSortBy] = useState<keyof Tender>("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isPushing, startPushing] = useTransition();
  const [isDeleting, startDeleting] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sortedTenders = useMemo(() => {
    return [...tenders].sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
      }
      const aStr = String(aVal);
      const bStr = String(bVal);
      const cmp = aStr.localeCompare(bStr);
      return sortOrder === "asc" ? cmp : -cmp;
    });
  }, [tenders, sortBy, sortOrder]);

  function handleSort(column: keyof Tender) {
    if (sortBy === column) {
      setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  }

  function toggleAll() {
    if (selected.size === sortedTenders.length) setSelected(new Set());
    else setSelected(new Set(sortedTenders.map((t) => t.id)));
  }

  function toggleOne(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  }

  function handleDirectUpload() {
    fileInputRef.current?.click();
  }

  function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) setUploadedFile(file);
  }

  function handleBatchPush() {
    startPushing(async () => {
      await pushQualifiedTendersToOdoo();
      setSelected(new Set());
      router.refresh();
    });
  }

  function handleBatchDelete() {
    const confirmFn = t("confirmDelete", lang);
    const msg = typeof confirmFn === "function" ? confirmFn(selected.size) : `Delete ${selected.size}?`;
    if (!window.confirm(msg)) return;
    startDeleting(async () => {
      const ids = Array.from(selected);
      for (const id of ids) {
        await deleteTender(id);
      }
      setSelected(new Set());
      router.refresh();
    });
  }

  const selectedFn = t("selected", lang);
  const selectedText = typeof selectedFn === "function" ? selectedFn(selected.size) : `${selected.size}`;

  if (uploadedFile) {
    return (
      <TenderUpload
        initialFile={uploadedFile}
        onBack={() => { setUploadedFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
      />
    );
  }

  if (tenders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls,.pdf"
          onChange={handleFileSelected}
          className="hidden"
        />
        <div className="mb-4 text-4xl">📄</div>
        <h3 className="mb-2 text-lg font-semibold text-foreground">
          {ts("noTenders", lang)}
        </h3>
        <p className="mb-6 text-sm text-muted-foreground">
          {ts("noTendersDesc", lang)}
        </p>
        <button
          type="button"
          onClick={handleDirectUpload}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-accent-600"
        >
          {ts("uploadTenders", lang)}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.xlsx,.xls,.pdf"
        onChange={handleFileSelected}
        className="hidden"
      />
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleDirectUpload}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-accent-600"
        >
          {ts("uploadTenders", lang)}
        </button>
      </div>

      {/* Batch action bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-accent-500/30 bg-accent-500/5 px-4 py-3">
          <span className="text-sm font-medium text-foreground">{selectedText}</span>
          <button
            type="button"
            onClick={handleBatchPush}
            disabled={isPushing}
            className="rounded-md bg-accent-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-accent-400 transition-colors disabled:opacity-50"
          >
            {isPushing ? ts("pushing", lang) : ts("sendSelectedToOdoo", lang)}
          </button>
          <button
            type="button"
            onClick={handleBatchDelete}
            disabled={isDeleting}
            className="rounded-md bg-destructive/10 border border-destructive/20 px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/20 transition-colors disabled:opacity-50 flex items-center gap-1.5"
          >
            <Trash2 className="h-3.5 w-3.5" />
            {isDeleting ? ts("deleting", lang) : ts("deleteSelected", lang)}
          </button>
        </div>
      )}

      {sortedTenders.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="w-10 px-3 py-3">
                  <input
                    type="checkbox"
                    checked={selected.size === sortedTenders.length && sortedTenders.length > 0}
                    onChange={toggleAll}
                    className="h-4 w-4 rounded border-border accent-accent-500"
                  />
                </th>
                <th
                  className="cursor-pointer px-4 py-3 text-start transition-colors hover:bg-muted/80"
                  onClick={() => handleSort("entity")}
                >
                  {ts("entity", lang)}{" "}
                  {sortBy === "entity" && (sortOrder === "asc" ? "↑" : "↓")}
                </th>
                <th
                  className="cursor-pointer px-4 py-3 text-start transition-colors hover:bg-muted/80"
                  onClick={() => handleSort("tender_title")}
                >
                  {ts("tenderTitle", lang)}{" "}
                  {sortBy === "tender_title" && (sortOrder === "asc" ? "↑" : "↓")}
                </th>
                <th
                  className="cursor-pointer px-4 py-3 text-start transition-colors hover:bg-muted/80"
                  onClick={() => handleSort("tender_number")}
                >
                  {ts("tenderNumber", lang)}{" "}
                  {sortBy === "tender_number" && (sortOrder === "asc" ? "↑" : "↓")}
                </th>
                <th
                  className="cursor-pointer px-4 py-3 text-start transition-colors hover:bg-muted/80"
                  onClick={() => handleSort("deadline")}
                >
                  {ts("deadline", lang)}{" "}
                  {sortBy === "deadline" && (sortOrder === "asc" ? "↑" : "↓")}
                </th>
                <th
                  className="cursor-pointer px-4 py-3 text-start transition-colors hover:bg-muted/80"
                  onClick={() => handleSort("estimated_value")}
                >
                  {ts("estimatedValue", lang)}{" "}
                  {sortBy === "estimated_value" && (sortOrder === "asc" ? "↑" : "↓")}
                </th>
                <th className="px-4 py-3 text-start">{ts("evaluation", lang)}</th>
                <th className="px-4 py-3 text-start">{ts("status", lang)}</th>
              </tr>
            </thead>
            <tbody>
              {sortedTenders.map((tender) => (
                <tr
                  key={tender.id}
                  className="cursor-pointer border-t border-border transition-colors hover:bg-muted/50"
                  onClick={() => router.push(`/tenders/${tender.id}`)}
                >
                  <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selected.has(tender.id)}
                      onChange={() => toggleOne(tender.id)}
                      className="h-4 w-4 rounded border-border accent-accent-500"
                    />
                  </td>
                  <td className="px-4 py-3">{tender.entity}</td>
                  <td className="px-4 py-3">{tender.tender_title}</td>
                  <td className="px-4 py-3">{tender.tender_number}</td>
                  <td className="px-4 py-3">
                    {new Date(tender.deadline).toLocaleDateString(lang === "ar" ? "ar-SA" : "en-US")}
                  </td>
                  <td className="px-4 py-3" dir="ltr">
                    {tender.estimated_value != null
                      ? Number(tender.estimated_value).toLocaleString(lang === "ar" ? "ar-SA" : "en-US")
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {tender.evaluation_score != null ? (
                      <ScoreBadge score={tender.evaluation_score} size="sm" />
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={tender.status} lang={lang} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
