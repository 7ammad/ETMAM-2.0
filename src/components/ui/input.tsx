import { forwardRef, type ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends ComponentPropsWithoutRef<"input"> {
  error?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, leftIcon, rightIcon, ...props }, ref) => (
    <div className="relative">
      {leftIcon && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
          {leftIcon}
        </div>
      )}
      <input
        type={type}
        ref={ref}
        className={cn(
          "flex h-10 w-full rounded-md bg-input px-3 py-2 text-sm text-foreground",
          "border border-border placeholder:text-muted-foreground",
          "transition-colors duration-200",
          "hover:border-border/80",
          "focus:outline-none focus:ring-2 focus:ring-accent-500/40 focus:border-accent-500",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
          leftIcon && "pr-10",
          rightIcon && "pl-10",
          error &&
            "border-confidence-low focus:ring-confidence-low/40 focus:border-confidence-low",
          className
        )}
        aria-invalid={error}
        {...props}
      />
      {rightIcon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
          {rightIcon}
        </div>
      )}
    </div>
  )
);
Input.displayName = "Input";

export { Input };
export type { InputProps };
