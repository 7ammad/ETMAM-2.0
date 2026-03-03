export default function OpportunityDetailLoading() {
  return (
    <main className="grid gap-6 lg:grid-cols-3 animate-[fadeIn_0.2s_ease-out]" dir="rtl">
      <div className="lg:col-span-2 space-y-6">
        <div className="h-5 w-24 skeleton rounded" />
        <div className="rounded-xl border border-border/40 bg-card p-6 space-y-5">
          <div className="h-7 w-48 skeleton rounded" />
          <div className="h-10 skeleton rounded-lg" />
          <div className="h-10 skeleton rounded-lg" />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="h-10 skeleton rounded-lg" />
            <div className="h-10 skeleton rounded-lg" />
          </div>
          <div className="h-24 skeleton rounded-lg" />
        </div>
      </div>
      <div className="space-y-4">
        <div className="h-28 skeleton rounded-xl" />
        <div className="h-20 skeleton rounded-xl" />
        <div className="h-32 skeleton rounded-xl" />
      </div>
    </main>
  );
}
