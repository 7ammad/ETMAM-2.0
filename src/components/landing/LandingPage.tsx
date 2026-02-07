import Link from "next/link";
import { Container, Section, Card, CardContent, buttonVariants } from "@/components/ui";
import { cn } from "@/lib/utils";

/**
 * Public landing page at /. Arabic RTL. When user is logged in, / redirects to /dashboard (handled in app/page.tsx).
 */
export function LandingPage() {
  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Hero */}
      <header className="border-b border-border py-12 sm:py-16" aria-label="رأس الصفحة">
        <Container size="lg">
          <div className="flex flex-col items-center gap-6 text-center">
            <h1 className="text-4xl font-bold text-foreground sm:text-5xl">
              إتمام
            </h1>
            <p className="max-w-xl text-lg text-muted-foreground">
              من الملف إلى الفرصة في دقائق
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                href="/login"
                className={cn(buttonVariants({ variant: "primary", size: "lg" }))}
              >
                تسجيل الدخول
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

      {/* Problem section — 3 cards */}
      <main id="main-content">
        <Section className="py-12 sm:py-16" aria-labelledby="problem-heading">
          <Container size="lg">
            <h2 id="problem-heading" className="mb-8 text-center text-2xl font-semibold text-foreground">
              لماذا إتمام؟
            </h2>
            <div className="grid gap-6 sm:grid-cols-3">
              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold text-foreground">البيانات متفرقة</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    إتمام يجمع بيانات المنافسات من ملفات Excel وكراسات الشروط PDF في مكان واحد
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold text-foreground">التقييم يدوي</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    إتمام يقيّم المنافسات بالذكاء الاصطناعي ويعطي توصية فورية
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold text-foreground">التكلفة تخمينية</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    إتمام يحسب التكاليف من بطاقات الأسعار الفعلية ويقارنها بالقيمة التقديرية
                  </p>
                </CardContent>
              </Card>
            </div>
          </Container>
        </Section>

        {/* Pipeline — simple text flow */}
        <Section className="border-t border-border bg-muted/30 py-10">
          <Container size="lg">
            <p className="text-center text-sm font-medium text-foreground">
              رفع الملف ← استخراج البيانات ← تقدير التكاليف ← التقييم ← التصدير إلى Odoo أو Excel
            </p>
          </Container>
        </Section>
      </main>
    </div>
  );
}
