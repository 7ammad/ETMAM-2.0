import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-foreground">
      <h1 className="text-2xl font-semibold">404 — الصفحة غير موجودة</h1>
      <p className="text-muted-foreground text-center text-sm">
        لم يتم العثور على الصفحة المطلوبة.
      </p>
      <Link
        href="/dashboard"
        className="rounded-md bg-gold-500 px-4 py-2 text-navy-950 font-medium hover:bg-gold-400"
      >
        العودة للوحة التحكم
      </Link>
    </div>
  );
}
