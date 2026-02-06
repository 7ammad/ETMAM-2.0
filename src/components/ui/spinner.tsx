import { cn } from "@/lib/utils";

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: "h-4 w-4 border-2",
  md: "h-6 w-6 border-2",
  lg: "h-8 w-8 border-3",
};

function Spinner({ size = "md", className }: SpinnerProps) {
  return (
    <div
      role="status"
      aria-label="جاري التحميل"
      className={cn(
        "animate-spin rounded-full border-gold-500/30 border-t-gold-500",
        sizeMap[size],
        className
      )}
    >
      <span className="sr-only">جاري التحميل...</span>
    </div>
  );
}

export { Spinner };
export type { SpinnerProps };
