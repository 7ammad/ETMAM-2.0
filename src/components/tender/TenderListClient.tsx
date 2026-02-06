"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { Tender } from "@/types/database";

interface TenderListClientProps {
  initialTenders: Tender[];
}

const STATUS_LABELS: Record<string, string> = {
  new: "جديد",
  evaluated: "مُقيّم",
  costed: "مُكلف",
  exported: "مُصدّر",
};

const STATUS_STYLES: Record<string, string> = {
  new: "bg-status-draft/20 text-status-draft",
  evaluated: "bg-status-scored/20 text-status-scored",
  costed: "bg-status-active/20 text-status-active",
  exported: "bg-status-pushed/20 text-status-pushed",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${STATUS_STYLES[status] ?? "bg-muted text-muted-foreground"}`}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

export function TenderListClient({ initialTenders }: TenderListClientProps) {
  const [tenders] = useState(initialTenders);
  const [sortBy, setSortBy] = useState<keyof Tender>("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

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

  if (tenders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-4 text-4xl">📄</div>
        <h3 className="mb-2 text-lg font-semibold text-foreground">
          لا توجد منافسات
        </h3>
        <p className="mb-6 text-sm text-muted-foreground">
          ابدأ برفع ملف CSV أو Excel يحتوي على بيانات المنافسات
        </p>
        <Link
          href="/tenders/upload"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-gold-600"
        >
          رفع منافسات
        </Link>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead className="bg-muted">
          <tr>
            <th
              className="cursor-pointer px-4 py-3 text-start transition-colors hover:bg-muted/80"
              onClick={() => handleSort("entity")}
            >
              الجهة{" "}
              {sortBy === "entity" && (sortOrder === "asc" ? "↑" : "↓")}
            </th>
            <th
              className="cursor-pointer px-4 py-3 text-start transition-colors hover:bg-muted/80"
              onClick={() => handleSort("tender_title")}
            >
              عنوان المنافسة{" "}
              {sortBy === "tender_title" && (sortOrder === "asc" ? "↑" : "↓")}
            </th>
            <th
              className="cursor-pointer px-4 py-3 text-start transition-colors hover:bg-muted/80"
              onClick={() => handleSort("tender_number")}
            >
              رقم المنافسة{" "}
              {sortBy === "tender_number" && (sortOrder === "asc" ? "↑" : "↓")}
            </th>
            <th
              className="cursor-pointer px-4 py-3 text-start transition-colors hover:bg-muted/80"
              onClick={() => handleSort("deadline")}
            >
              الموعد النهائي{" "}
              {sortBy === "deadline" && (sortOrder === "asc" ? "↑" : "↓")}
            </th>
            <th
              className="cursor-pointer px-4 py-3 text-start transition-colors hover:bg-muted/80"
              onClick={() => handleSort("estimated_value")}
            >
              القيمة التقديرية{" "}
              {sortBy === "estimated_value" && (sortOrder === "asc" ? "↑" : "↓")}
            </th>
            <th className="px-4 py-3 text-start">الحالة</th>
          </tr>
        </thead>
        <tbody>
          {sortedTenders.map((tender) => (
            <tr
              key={tender.id}
              className="cursor-pointer border-t border-border transition-colors hover:bg-muted/50"
              onClick={() => window.location.assign(`/tenders/${tender.id}`)}
            >
              <td className="px-4 py-3">{tender.entity}</td>
              <td className="px-4 py-3">{tender.tender_title}</td>
              <td className="px-4 py-3">{tender.tender_number}</td>
              <td className="px-4 py-3">
                {new Date(tender.deadline).toLocaleDateString("ar-SA")}
              </td>
              <td className="px-4 py-3" dir="ltr">
                {Number(tender.estimated_value).toLocaleString("ar-SA")}
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={tender.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
