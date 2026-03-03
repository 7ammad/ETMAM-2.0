import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center bg-background" dir="rtl">
      {/* Background pattern */}
      <div className="node-pattern absolute inset-0" />
      <div className="absolute inset-0 bg-gradient-to-b from-accent-500/[0.03] via-transparent to-transparent" />

      <div className="relative w-full max-w-sm space-y-8 px-4">
        {/* Brand mark */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-500/15 ring-1 ring-accent-500/25">
            <span className="text-lg font-bold text-accent-400">إ</span>
          </div>
          <h1 className="text-xl font-bold text-foreground tracking-tight">
            تسجيل الدخول
          </h1>
          <p className="text-sm text-muted-foreground">إتمام — تقييم المنافسات</p>
        </div>

        <LoginForm />
      </div>
    </main>
  );
}
