import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-navy-700 text-navy-200 border border-navy-600",
        primary: "bg-gold-500/15 text-gold-400 border border-gold-500/25",
        success:
          "bg-confidence-high/15 text-confidence-high border border-confidence-high/25",
        warning:
          "bg-confidence-medium/15 text-confidence-medium border border-confidence-medium/25",
        danger:
          "bg-confidence-low/15 text-confidence-low border border-confidence-low/25",
        info: "bg-status-active/15 text-status-active border border-status-active/25",
        purple:
          "bg-status-scored/15 text-status-scored border border-status-scored/25",
      },
      size: {
        sm: "text-[10px] px-1.5 py-px",
        md: "text-xs px-2.5 py-0.5",
        lg: "text-sm px-3 py-1",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
}

function Badge({ className, variant, size, dot, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {dot && (
        <span
          className="h-1.5 w-1.5 rounded-full bg-current"
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
}

export { Badge, badgeVariants };
export type { BadgeProps };
