"use client";

export default function OpportunitiesError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <main className="flex min-h-[50vh] flex-col items-center justify-center text-center">
      <h2 className="text-lg font-semibold text-destructive mb-2">حدث خطأ</h2>
      <p className="text-sm text-muted-foreground mb-4">{error.message}</p>
      <button
        type="button"
        onClick={reset}
        className="rounded-lg bg-accent-500 px-4 py-2 text-sm font-medium text-white hover:bg-accent-400 transition-colors"
      >
        إعادة المحاولة
      </button>
    </main>
  );
}
