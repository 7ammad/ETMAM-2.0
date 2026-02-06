export default function DashboardLoading() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="h-8 w-8 animate-pulse rounded-full bg-gold-500/30" aria-hidden />
      <span className="sr-only">جاري التحميل...</span>
    </div>
  );
}
