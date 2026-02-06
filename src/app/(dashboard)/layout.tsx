import type { ReactNode } from "react";
import Link from "next/link";

/**
 * Dashboard layout shell — sidebar + header per FRONTEND.md / APP-FLOW.md.
 * Sidebar and header content will be replaced by real components in Phase 1.3+.
 */
export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar — 240px per FRONTEND.md */}
      <aside
        className="w-60 shrink-0 border-e border-border bg-card p-4"
        aria-label="القائمة الرئيسية"
      >
        <div className="mb-6 font-semibold text-gold-500">إتمام</div>
        <nav className="flex flex-col gap-1">
          <Link
            href="/dashboard"
            className="rounded-md px-3 py-2 text-sm text-foreground hover:bg-muted"
          >
            لوحة التحكم
          </Link>
          <Link
            href="/tenders"
            className="rounded-md px-3 py-2 text-sm text-foreground hover:bg-muted"
          >
            المنافسات
          </Link>
          <Link
            href="/tenders/upload"
            className="rounded-md px-3 py-2 text-sm text-foreground hover:bg-muted"
          >
            رفع منافسة
          </Link>
          <Link
            href="/pipeline"
            className="rounded-md px-3 py-2 text-sm text-foreground hover:bg-muted"
          >
            المسار
          </Link>
          <Link
            href="/settings"
            className="rounded-md px-3 py-2 text-sm text-foreground hover:bg-muted"
          >
            الإعدادات
          </Link>
        </nav>
      </aside>

      {/* Main: header + content */}
      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-10 border-b border-border bg-card px-6 py-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">إتمام — نظام إدارة المنافسات</span>
            {/* User menu placeholder — Phase 1.3 Auth */}
          </div>
        </header>
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
