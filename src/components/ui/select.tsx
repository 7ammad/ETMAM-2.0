import { forwardRef, type ComponentPropsWithoutRef } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface SelectProps extends ComponentPropsWithoutRef<"select"> {
  error?: boolean;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  placeholder?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, options, placeholder, ...props }, ref) => (
    <div className="relative">
      <select
        ref={ref}
        className={cn(
          "flex h-10 w-full appearance-none rounded-md bg-muted px-3 py-2 text-sm text-foreground",
          "border border-border pe-10",
          "transition-colors duration-200",
          "hover:border-border/80",
          "focus:outline-none focus:ring-2 focus:ring-accent-500/40 focus:border-accent-500",
          "disabled:cursor-not-allowed disabled:opacity-50",
          error &&
            "border-confidence-low focus:ring-confidence-low/40 focus:border-confidence-low",
          className
        )}
        aria-invalid={error}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} disabled={opt.disabled}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
    </div>
  )
);
Select.displayName = "Select";

export { Select };
export type { SelectProps };
