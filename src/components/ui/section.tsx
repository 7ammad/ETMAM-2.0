import { cn } from "@/lib/utils";

interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
}

function Section({
  title,
  description,
  actions,
  className,
  children,
  ...props
}: SectionProps) {
  return (
    <section className={cn("space-y-4", className)} {...props}>
      {(title || actions) && (
        <div className="flex items-center justify-between gap-4">
          <div>
            {title && (
              <h2 className="text-base font-semibold text-navy-100">
                {title}
              </h2>
            )}
            {description && (
              <p className="text-sm text-muted-foreground mt-0.5">
                {description}
              </p>
            )}
          </div>
          {actions && (
            <div className="flex items-center gap-2 shrink-0">{actions}</div>
          )}
        </div>
      )}
      {children}
    </section>
  );
}

export { Section };
export type { SectionProps };
