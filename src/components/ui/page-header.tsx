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
        <nav aria-label="التنقل" className="mb-3">
          <ol className="flex items-center gap-1 text-sm text-muted-foreground">
            {breadcrumbs.map((item, i) => (
              <li key={i} className="flex items-center gap-1">
                {i > 0 && (
                  <ChevronLeft className="h-3.5 w-3.5 shrink-0" />
                )}
                {item.href ? (
                  <a
                    href={item.href}
                    className="hover:text-navy-200 transition-colors"
                  >
                    {item.label}
                  </a>
                ) : (
                  <span className="text-navy-300">{item.label}</span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}

      {/* Title row */}
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-navy-50 truncate">{title}</h1>
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
