"use client";

import type { CRMExportPayload } from "@/app/actions/pipeline";

const CRM_FIELDS: { key: keyof CRMExportPayload; labelAr: string }[] = [
  { key: "entity", labelAr: "الجهة" },
  { key: "title", labelAr: "العنوان" },
  { key: "number", labelAr: "رقم المنافسة" },
  { key: "deadline", labelAr: "الموعد النهائي" },
  { key: "value", labelAr: "القيمة التقديرية" },
  { key: "score", labelAr: "التقييم" },
  { key: "recommendation", labelAr: "التوصية" },
];

interface CRMFieldMappingProps {
  payload: CRMExportPayload;
}

export function CRMFieldMapping({ payload }: CRMFieldMappingProps) {
  return (
    <dl className="grid gap-2 text-sm">
      {CRM_FIELDS.map(({ key, labelAr }) => {
        const value = payload[key];
        const display =
          value == null
            ? "—"
            : typeof value === "number"
              ? value.toLocaleString("ar-SA")
              : String(value);
        return (
          <div key={key} className="flex justify-between gap-4">
            <dt className="text-muted-foreground">{labelAr}</dt>
            <dd className="text-end font-medium text-foreground" dir="ltr">
              {display}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}
