"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Settings,
} from "lucide-react";
import { useLanguageStore } from "@/stores/language-store";
import { ts } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, labelKey: "dashboard" as const },
  { href: "/tenders", icon: FileText, labelKey: "tenders" as const },
  { href: "/settings", icon: Settings, labelKey: "settings" as const },
];

export function Sidebar() {
  const pathname = usePathname();
  const lang = useLanguageStore((s) => s.lang);

  return (
    <aside
      className="flex w-60 shrink-0 flex-col border-e border-border/40 bg-card"
      aria-label={lang === "ar" ? "القائمة الرئيسية" : "Main navigation"}
    >
      {/* Brand */}
      <div className="flex h-16 items-center gap-3 border-b border-border/40 px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-500/15 ring-1 ring-accent-500/25">
          <span className="text-sm font-bold text-accent-400">إ</span>
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-bold text-foreground tracking-tight">
            {ts("brand", lang)}
          </span>
          <span className="text-[10px] leading-tight text-muted-foreground">
            {ts("brandSub", lang)}
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-0.5 p-3">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                "border-s-2",
                isActive
                  ? "border-s-accent-500 bg-accent-500/5 text-foreground"
                  : "border-s-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}
            >
              <Icon
                className={cn(
                  "h-[18px] w-[18px] shrink-0 transition-colors",
                  isActive
                    ? "text-accent-400"
                    : "text-muted-foreground group-hover:text-foreground"
                )}
              />
              {ts(item.labelKey, lang)}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
