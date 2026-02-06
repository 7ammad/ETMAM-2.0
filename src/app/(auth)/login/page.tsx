import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background">
      <h1 className="text-xl font-semibold text-foreground">تسجيل الدخول — إتمام</h1>
      <LoginForm />
    </main>
  );
}
