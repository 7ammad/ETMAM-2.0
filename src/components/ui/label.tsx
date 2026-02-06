import { forwardRef, type ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";

interface LabelProps extends ComponentPropsWithoutRef<"label"> {
  required?: boolean;
}

const Label = forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, required, children, ...props }, ref) => (
    <label
      ref={ref}
      className={cn(
        "text-sm font-medium text-navy-200 leading-none",
        "peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
        className
      )}
      {...props}
    >
      {children}
      {required && (
        <span className="text-confidence-low mr-1" aria-hidden="true">
          *
        </span>
      )}
    </label>
  )
);
Label.displayName = "Label";

export { Label };
export type { LabelProps };
