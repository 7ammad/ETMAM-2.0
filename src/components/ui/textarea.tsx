import { forwardRef, type ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";

interface TextareaProps extends ComponentPropsWithoutRef<"textarea"> {
  error?: boolean;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "flex min-h-[80px] w-full rounded-md bg-navy-800 px-3 py-2 text-sm text-navy-50",
        "border border-navy-600 placeholder:text-navy-500",
        "transition-colors duration-200 resize-y",
        "hover:border-navy-500",
        "focus:outline-none focus:ring-2 focus:ring-gold-500/40 focus:border-gold-500",
        "disabled:cursor-not-allowed disabled:opacity-50",
        error &&
          "border-confidence-low focus:ring-confidence-low/40 focus:border-confidence-low",
        className
      )}
      aria-invalid={error}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";

export { Textarea };
export type { TextareaProps };
