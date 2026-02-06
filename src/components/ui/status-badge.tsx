import { Badge } from "./badge";

type TenderStatus =
  | "draft"
  | "active"
  | "scored"
  | "pushed"
  | "rejected"
  | "expired";

const statusConfig: Record<
  TenderStatus,
  { label: string; variant: "default" | "info" | "purple" | "success" | "danger" | "warning" }
> = {
  draft: { label: "مسودة", variant: "default" },
  active: { label: "نشطة", variant: "info" },
  scored: { label: "مقيّمة", variant: "purple" },
  pushed: { label: "مرسلة للCRM", variant: "success" },
  rejected: { label: "مرفوضة", variant: "danger" },
  expired: { label: "منتهية", variant: "default" },
};

interface StatusBadgeProps {
  status: TenderStatus;
  className?: string;
}

function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.draft;
  return (
    <Badge variant={config.variant} dot className={className}>
      {config.label}
    </Badge>
  );
}

export { StatusBadge };
export type { StatusBadgeProps, TenderStatus };
