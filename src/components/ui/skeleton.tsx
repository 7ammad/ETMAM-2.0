import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Width class, e.g. "w-32" */
  width?: string;
  /** Height class, e.g. "h-4" */
  height?: string;
}

function Skeleton({ className, width, height, ...props }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "skeleton rounded-md",
        width,
        height || "h-4",
        className
      )}
      {...props}
    />
  );
}

function SkeletonText({
  lines = 3,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={i === lines - 1 ? "w-3/4" : "w-full"}
        />
      ))}
    </div>
  );
}

function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-lg border border-navy-700 bg-navy-900 p-5 space-y-4",
        className
      )}
      aria-hidden="true"
    >
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
      <SkeletonText lines={2} />
    </div>
  );
}

export { Skeleton, SkeletonText, SkeletonCard };
export type { SkeletonProps };
