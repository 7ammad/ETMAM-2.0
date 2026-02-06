"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-foreground">
      <h1 className="text-xl font-semibold">حدث خطأ</h1>
      <p className="text-muted-foreground text-center text-sm max-w-md">
        {error.message || "حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى."}
      </p>
      <button
        type="button"
        onClick={reset}
        className="rounded-md bg-gold-500 px-4 py-2 text-navy-950 font-medium hover:bg-gold-400"
      >
        إعادة المحاولة
      </button>
    </div>
  );
}
