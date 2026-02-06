import { cva, type VariantProps } from "class-variance-authority";
import {
  AlertCircle,
  CheckCircle2,
  Info,
  AlertTriangle,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const alertVariants = cva(
  "relative flex gap-3 rounded-lg border p-4 text-sm",
  {
    variants: {
      variant: {
        default: "bg-navy-800 border-navy-600 text-navy-200",
        info: "bg-status-active/10 border-status-active/25 text-status-active",
        success:
          "bg-confidence-high/10 border-confidence-high/25 text-confidence-high",
        warning:
          "bg-confidence-medium/10 border-confidence-medium/25 text-confidence-medium",
        destructive:
          "bg-confidence-low/10 border-confidence-low/25 text-confidence-low",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const iconMap = {
  default: Info,
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  destructive: AlertCircle,
};

interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  title?: string;
  onClose?: () => void;
}

function Alert({
  className,
  variant = "default",
  title,
  children,
  onClose,
  ...props
}: AlertProps) {
  const Icon = iconMap[variant || "default"];

  return (
    <div
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    >
      <Icon className="h-5 w-5 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        {title && <p className="font-semibold mb-1">{title}</p>}
        <div className="text-current/80">{children}</div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="shrink-0 p-1 rounded hover:bg-white/10 transition-colors"
          aria-label="إغلاق"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

export { Alert, alertVariants };
export type { AlertProps };
