import { RegisterForm } from "@/components/auth/RegisterForm";

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background">
      <h1 className="text-xl font-semibold text-foreground">إنشاء حساب — إتمام</h1>
      <RegisterForm />
    </main>
  );
}
