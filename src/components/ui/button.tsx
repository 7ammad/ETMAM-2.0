"use client";

import { forwardRef, type ComponentPropsWithoutRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 font-medium",
    "rounded-md transition-all duration-200",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950",
    "disabled:pointer-events-none disabled:opacity-50",
    "cursor-pointer select-none",
  ],
  {
    variants: {
      variant: {
        primary:
          "bg-gold-500 text-navy-950 hover:bg-gold-400 active:bg-gold-600 shadow-sm",
        secondary:
          "bg-navy-700 text-navy-100 hover:bg-navy-600 active:bg-navy-800 border border-navy-600",
        outline:
          "border border-navy-600 text-navy-200 hover:bg-navy-800 hover:text-navy-50 active:bg-navy-700",
        ghost:
          "text-navy-300 hover:bg-navy-800 hover:text-navy-100 active:bg-navy-700",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-red-600 active:bg-red-700",
        link: "text-gold-500 hover:text-gold-400 underline-offset-4 hover:underline p-0 h-auto",
      },
      size: {
        sm: "h-8 px-3 text-sm",
        md: "h-10 px-4 text-sm",
        lg: "h-12 px-6 text-base",
        icon: "h-10 w-10",
        "icon-sm": "h-8 w-8",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

interface ButtonProps
  extends ComponentPropsWithoutRef<"button">,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      isLoading,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={isLoading || disabled}
      aria-busy={isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : leftIcon ? (
        <span className="shrink-0">{leftIcon}</span>
      ) : null}
      {children}
      {rightIcon && !isLoading && (
        <span className="shrink-0">{rightIcon}</span>
      )}
    </button>
  )
);
Button.displayName = "Button";

export { Button, buttonVariants };
export type { ButtonProps };
