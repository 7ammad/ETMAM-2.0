"use client";

import { Toaster as SonnerToaster, toast } from "sonner";

function Toaster() {
  return (
    <SonnerToaster
      position="bottom-left"
      dir="rtl"
      toastOptions={{
        style: {
          background: "var(--color-muted)",
          color: "var(--color-foreground)",
          border: "1px solid var(--color-border)",
          fontFamily: "var(--font-sans)",
        },
        className: "!rounded-lg",
      }}
      closeButton
    />
  );
}

export { Toaster, toast };
