export default function RootLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="h-8 w-8 animate-pulse rounded-full bg-gold-500/30" aria-hidden />
      <span className="sr-only">جاري التحميل...</span>
    </div>
  );
}
