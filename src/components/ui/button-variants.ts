/**
 * Button variant classes — server-safe (no "use client").
 * Use in Server Components (e.g. Link with button look) or Client Components.
 */
import { cva } from "class-variance-authority";

export const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 font-medium",
    "rounded-md transition-all duration-200",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "disabled:pointer-events-none disabled:opacity-50",
    "cursor-pointer select-none",
  ],
  {
    variants: {
      variant: {
        primary:
          "bg-accent-500 text-white hover:bg-accent-400 active:bg-accent-600",
        secondary:
          "bg-noir-800 text-zinc-200 hover:bg-noir-700 active:bg-noir-800 border border-noir-700",
        outline:
          "border border-border text-foreground hover:bg-muted hover:text-foreground active:bg-muted/80",
        ghost:
          "text-muted-foreground hover:bg-muted hover:text-foreground active:bg-muted/80",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-red-600 active:bg-red-700",
        link: "text-accent-500 hover:text-accent-400 underline-offset-4 hover:underline p-0 h-auto",
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
