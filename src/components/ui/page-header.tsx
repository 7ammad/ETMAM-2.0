import { cn } from "@/lib/utils";
import { ChevronLeft } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  className?: string;
}

function PageHeader({
  title,
  description,
  breadcrumbs,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("mb-6", className)}>
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="mb-3">
          <ol className="flex items-center gap-1 text-sm text-muted-foreground">
            {breadcrumbs.map((item, i) => (
              <li key={i} className="flex items-center gap-1">
                {i > 0 && (
                  <ChevronLeft className="h-3.5 w-3.5 shrink-0" />
                )}
                {item.href ? (
                  <a
                    href={item.href}
                    className="hover:text-foreground transition-colors"
                  >
                    {item.label}
                  </a>
                ) : (
                  <span className="text-muted-foreground">{item.label}</span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}

      {/* Title row */}
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-foreground tracking-tight truncate">{title}</h1>
          {description && (
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2 shrink-0">{actions}</div>
        )}
      </div>
    </div>
  );
}

export { PageHeader };
export type { PageHeaderProps, BreadcrumbItem };
