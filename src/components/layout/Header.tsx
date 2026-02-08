"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { logout } from "@/app/actions/auth";
import { useTheme } from "next-themes";
import { useLanguageStore } from "@/stores/language-store";
import { ts } from "@/lib/i18n";
import { Sun, Moon, LogOut } from "lucide-react";

export function Header() {
  const { user, loading } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const { lang, toggle: toggleLang } = useLanguageStore();

  // Avoid hydration mismatch — next-themes resolves on client only
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-border bg-card/80 px-6 backdrop-blur-sm">
      {/* Left / Start — spacer or breadcrumb */}
      <div />

      {/* Right / End — controls */}
      <div className="flex items-center gap-2">
        {/* Language toggle */}
        <button
          type="button"
          onClick={toggleLang}
          className="flex h-9 items-center rounded-lg border border-border px-3 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
          aria-label={
            lang === "ar" ? "Switch to English" : "التبديل إلى العربية"
          }
        >
          {lang === "ar" ? "EN" : "عربي"}
        </button>

        {/* Theme toggle */}
        <button
          type="button"
          onClick={() =>
            setTheme(resolvedTheme === "dark" ? "light" : "dark")
          }
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-foreground transition-colors hover:bg-muted"
          aria-label={
            mounted && resolvedTheme === "dark"
              ? "Switch to light mode"
              : "Switch to dark mode"
          }
        >
          {mounted && resolvedTheme === "dark" ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </button>

        {/* Separator */}
        <div className="mx-1 h-6 w-px bg-border" />

        {/* User */}
        {loading ? (
          <span className="text-sm text-muted-foreground">...</span>
        ) : user ? (
          <>
            <span className="text-sm text-foreground">
              {user.user_metadata?.full_name ?? user.email ?? ts("user", lang)}
            </span>
            <form action={logout}>
              <button
                type="submit"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label={ts("logout", lang)}
              >
                <LogOut className="h-4 w-4" />
              </button>
            </form>
          </>
        ) : null}
      </div>
    </header>
  );
}
