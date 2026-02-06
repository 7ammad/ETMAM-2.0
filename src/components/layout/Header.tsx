"use client";

import { useAuth } from "@/hooks/use-auth";
import { logout } from "@/app/actions/auth";

export function Header() {
  const { user, loading } = useAuth();

  return (
    <header className="sticky top-0 z-10 border-b border-border bg-card px-6 py-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          إتمام — نظام إدارة المنافسات
        </span>
        <div className="flex items-center gap-4">
          {loading ? (
            <span className="text-sm text-muted-foreground">...</span>
          ) : user ? (
            <>
              <span className="text-sm text-foreground">
                {user.user_metadata?.full_name ?? user.email ?? "مستخدم"}
              </span>
              <form action={logout}>
                <button
                  type="submit"
                  className="rounded-md border border-border px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-muted"
                >
                  تسجيل الخروج
                </button>
              </form>
            </>
          ) : null}
        </div>
      </div>
    </header>
  );
}
