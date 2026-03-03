"use client";

import { useEffect } from "react";

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Auth error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 px-4">
      <p className="text-destructive text-sm">{error.message}</p>
      <button
        type="button"
        onClick={reset}
        className="rounded-md border border-border bg-muted px-4 py-2 text-sm hover:bg-muted/80"
      >
        إعادة المحاولة
      </button>
    </div>
  );
}
