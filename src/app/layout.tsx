import type { Metadata } from "next";
import { Cairo, Noto_Kufi_Arabic } from "next/font/google";
import { ThemeProvider } from "@/providers/theme-provider";
import { Toaster } from "@/components/ui/toast";
import { LanguageSync } from "@/components/layout/LanguageSync";
import "./globals.css";

const cairo = Cairo({
  subsets: ["latin", "arabic"],
  display: "swap",
  variable: "--font-cairo",
});

const notoKufiArabic = Noto_Kufi_Arabic({
  subsets: ["arabic"],
  display: "swap",
  variable: "--font-noto-kufi",
});

export const metadata: Metadata = {
  title: {
    default: "إتمام — نظام إدارة المنافسات",
    template: "%s | إتمام",
  },
  description:
    "نظام ذكي لإدارة المنافسات الحكومية — من الملف إلى الفرصة في دقائق",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      suppressHydrationWarning
      className={`${cairo.variable} ${notoKufiArabic.variable}`}
    >
      <body className="antialiased min-h-screen bg-background text-foreground">
        <ThemeProvider>
          <LanguageSync />
          {children}
        </ThemeProvider>
        <Toaster />
      </body>
    </html>
  );
}
