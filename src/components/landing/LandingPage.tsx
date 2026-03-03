import Link from "next/link";
import { Container, buttonVariants } from "@/components/ui";
import { cn } from "@/lib/utils";
import {
  FileSearch,
  Brain,
  TrendingUp,
  Upload,
  Cpu,
  BarChart3,
  CheckCircle2,
  FileOutput,
} from "lucide-react";

/**
 * Public landing page at /. Arabic RTL.
 * When user is logged in, / redirects to /dashboard (handled in app/page.tsx).
 */
export function LandingPage() {
  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* ── Hero ── */}
      <header className="relative overflow-hidden" aria-label="رأس الصفحة">
        {/* Background pattern */}
        <div className="node-pattern absolute inset-0" />
        <div className="absolute inset-0 bg-gradient-to-b from-accent-500/[0.04] via-transparent to-transparent" />

        <Container size="lg" className="relative py-24 sm:py-32">
          <div className="flex flex-col items-center gap-8 text-center">
            {/* Overline */}
            <span className="text-overline text-accent-400">
              منصة تقييم المنافسات بالذكاء الاصطناعي
            </span>

            {/* Display title */}
            <h1 className="text-display text-gradient-accent">
              إتمام
            </h1>

            {/* Subtitle */}
            <p className="max-w-lg text-lg text-muted-foreground leading-relaxed">
              من الملف إلى الفرصة في دقائق — استخراج، تحليل، وتقييم
              المنافسات الحكومية بدقة وسرعة
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap justify-center gap-3 mt-2">
              <Link
                href="/login"
                className={cn(
                  buttonVariants({ variant: "primary", size: "lg" }),
                  "glow-accent"
                )}
              >
                ابدأ الآن
              </Link>
              <Link
                href="/register"
                className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
              >
                إنشاء حساب
              </Link>
            </div>
          </div>
        </Container>
      </header>

      <main id="main-content">
        {/* ── Problem Section — Bento Grid ── */}
        <section className="py-20 sm:py-24" aria-labelledby="problem-heading">
          <Container size="lg">
            <div className="text-center mb-12">
              <span className="text-overline text-muted-foreground">المشكلة</span>
              <h2
                id="problem-heading"
                className="text-2xl font-bold text-foreground tracking-tight mt-3"
              >
                لماذا إتمام؟
              </h2>
            </div>

            {/* Asymmetric bento: 1 large (3/5) + 2 stacked (2/5) */}
            <div className="grid gap-4 sm:grid-cols-5">
              {/* Hero card — 3/5 width */}
              <div className="sm:col-span-3 rounded-xl border border-border/40 bg-card p-8 sm:p-10 flex flex-col justify-center">
                <div className="p-3 rounded-lg bg-accent-500/10 w-fit mb-5">
                  <FileSearch className="h-6 w-6 text-accent-400" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">
                  البيانات متفرقة ومعقدة
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  كراسات شروط بعشرات الصفحات، جداول Excel متعددة، ومعايير تقييم
                  مختلفة لكل منافسة. إتمام يجمع كل هذا في مكان واحد ويستخرج
                  البيانات المهمة تلقائياً.
                </p>
              </div>

              {/* 2 stacked cards — 2/5 width */}
              <div className="sm:col-span-2 flex flex-col gap-4">
                <div className="flex-1 rounded-xl border border-border/40 bg-card p-6 sm:p-7">
                  <div className="p-3 rounded-lg bg-accent-500/10 w-fit mb-4">
                    <Brain className="h-5 w-5 text-accent-400" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground mb-2">
                    التقييم يدوي وبطيء
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    إتمام يقيّم المنافسات بالذكاء الاصطناعي ويعطي توصية فورية
                    مع شرح مفصّل لكل معيار.
                  </p>
                </div>

                <div className="flex-1 rounded-xl border border-border/40 bg-card p-6 sm:p-7">
                  <div className="p-3 rounded-lg bg-accent-500/10 w-fit mb-4">
                    <TrendingUp className="h-5 w-5 text-accent-400" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground mb-2">
                    التكلفة تخمينية
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    إتمام يحسب التكاليف من عروض أسعار الموردين
                    ويقارنها بالقيمة التقديرية.
                  </p>
                </div>
              </div>
            </div>
          </Container>
        </section>

        {/* ── Pipeline Stepper ── */}
        <section className="border-t border-border/40 bg-card/50 py-16 sm:py-20">
          <Container size="lg">
            <div className="text-center mb-12">
              <span className="text-overline text-muted-foreground">كيف يعمل</span>
              <h2 className="text-2xl font-bold text-foreground tracking-tight mt-3">
                من الملف إلى القرار
              </h2>
            </div>

            {/* Horizontal stepper */}
            <div className="flex flex-col sm:flex-row items-stretch gap-6 sm:gap-0">
              {[
                { icon: Upload, label: "رفع الملف", desc: "PDF أو Excel" },
                { icon: Cpu, label: "استخراج البيانات", desc: "ذكاء اصطناعي" },
                { icon: BarChart3, label: "التحليل والتقييم", desc: "معايير قابلة للتخصيص" },
                { icon: CheckCircle2, label: "التوصية", desc: "قرار مبني على بيانات" },
                { icon: FileOutput, label: "التصدير", desc: "Odoo أو Excel" },
              ].map((step, i, arr) => (
                <div key={step.label} className="flex-1 flex flex-col items-center text-center relative">
                  {/* Connector line (between steps) */}
                  {i < arr.length - 1 && (
                    <div className="hidden sm:block absolute top-5 start-[calc(50%+20px)] end-[calc(-50%+20px)] h-px bg-border/60" />
                  )}

                  {/* Icon circle */}
                  <div className={cn(
                    "relative z-10 flex h-10 w-10 items-center justify-center rounded-full",
                    "bg-accent-500/10 border border-accent-500/25",
                    "mb-3"
                  )}>
                    <step.icon className="h-5 w-5 text-accent-400" />
                  </div>

                  <h3 className="text-sm font-semibold text-foreground">{step.label}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{step.desc}</p>
                </div>
              ))}
            </div>
          </Container>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-border/40 py-8">
        <Container size="lg">
          <p className="text-center text-xs text-muted-foreground">
            إتمام — تقييم المنافسات بالذكاء الاصطناعي
          </p>
        </Container>
      </footer>
    </div>
  );
}
