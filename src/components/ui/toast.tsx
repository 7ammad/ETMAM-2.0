"use client";

import { Toaster as SonnerToaster, toast } from "sonner";

function Toaster() {
  return (
    <SonnerToaster
      position="bottom-left"
      dir="rtl"
      toastOptions={{
        style: {
          background: "var(--color-navy-800)",
          color: "var(--color-navy-50)",
          border: "1px solid var(--color-navy-600)",
          fontFamily: "var(--font-sans)",
        },
        className: "!rounded-lg",
      }}
      closeButton
    />
  );
}

export { Toaster, toast };
