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
          "flex h-10 w-full appearance-none rounded-md bg-navy-800 px-3 py-2 text-sm text-navy-50",
          "border border-navy-600 pe-10",
          "transition-colors duration-200",
          "hover:border-navy-500",
          "focus:outline-none focus:ring-2 focus:ring-gold-500/40 focus:border-gold-500",
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
      <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-navy-400 pointer-events-none" />
    </div>
  )
);
Select.displayName = "Select";

export { Select };
export type { SelectProps };
