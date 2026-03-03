"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { logout } from "@/app/actions/auth";
import { useTheme } from "next-themes";
import { useLanguageStore } from "@/stores/language-store";
import { ts } from "@/lib/i18n";
import { Sun, Moon, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

export function Header() {
  const { user, loading } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const { lang, toggle: toggleLang } = useLanguageStore();

  // Avoid hydration mismatch — next-themes resolves on client only
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-border/40 bg-card/80 px-6 backdrop-blur-xl">
      {/* Start — spacer or breadcrumb */}
      <div />

      {/* End — controls */}
      <div className="flex items-center gap-1.5">
        {/* Compact pill group */}
        <div className="flex items-center rounded-lg border border-border/40 bg-background/50">
          {/* Language toggle */}
          <button
            type="button"
            onClick={toggleLang}
            className="flex h-8 items-center px-3 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
            aria-label={
              lang === "ar" ? "Switch to English" : "التبديل إلى العربية"
            }
          >
            {lang === "ar" ? "EN" : "عربي"}
          </button>

          {/* Divider */}
          <div className="h-4 w-px bg-border/40" />

          {/* Theme toggle */}
          <button
            type="button"
            onClick={() =>
              setTheme(resolvedTheme === "dark" ? "light" : "dark")
            }
            className="flex h-8 w-8 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
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
        </div>

        {/* User section */}
        {loading ? (
          <span className="text-sm text-muted-foreground">...</span>
        ) : user ? (
          <div className="flex items-center gap-2 ms-2">
            {/* Avatar circle */}
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-500/15 text-xs font-semibold text-accent-400 ring-1 ring-accent-500/25">
              {(user.user_metadata?.full_name ?? user.email ?? "U").charAt(0).toUpperCase()}
            </div>
            <form action={logout}>
              <button
                type="submit"
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg",
                  "text-muted-foreground transition-colors hover:text-foreground hover:bg-muted/50"
                )}
                aria-label={ts("logout", lang)}
              >
                <LogOut className="h-4 w-4" />
              </button>
            </form>
          </div>
        ) : null}
      </div>
    </header>
  );
}
