"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export type AuthResult = {
  error?: string;
};

const loginSchema = z.object({
  email: z.string().email().trim().min(1),
  password: z.string().min(1),
});

export async function login(
  _prevState: AuthResult | null,
  formData: FormData
): Promise<AuthResult> {
  const rawEmail = formData.get("email") as string;
  const rawPassword = formData.get("password") as string;

  const loginParsed = loginSchema.safeParse({ email: rawEmail, password: rawPassword });
  if (!loginParsed.success) {
    return { error: "البريد الإلكتروني وكلمة المرور مطلوبان" };
  }
  const email = loginParsed.data.email;
  const password = loginParsed.data.password;

  let success = false;
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) {
      if (error.message.includes("Invalid login credentials")) {
        return { error: "بيانات الدخول غير صحيحة" };
      }
      return { error: "حدث خطأ أثناء تسجيل الدخول: " + error.message };
    }
    success = true;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { error: "حدث خطأ أثناء تسجيل الدخول: " + msg };
  }
  if (success) {
    redirect("/dashboard");
  }
  return {};
}

const registerSchema = z.object({
  email: z.string().email().trim().min(1),
  password: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
  fullName: z.string().trim().min(1),
  confirmPassword: z.string().min(1),
}).refine((data) => data.password === data.confirmPassword, {
  message: "كلمات المرور غير متطابقة",
  path: ["confirmPassword"],
});

export async function register(
  _prevState: AuthResult | null,
  formData: FormData
): Promise<AuthResult> {
  const registerParsed = registerSchema.safeParse({
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    fullName: formData.get("fullName") as string,
    confirmPassword: formData.get("confirmPassword") as string,
  });

  if (!registerParsed.success) {
    const firstError = registerParsed.error.issues[0]?.message;
    return { error: firstError ?? "جميع الحقول مطلوبة" };
  }
  const { email, password, fullName } = registerParsed.data;

  let success = false;
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { full_name: fullName.trim() },
      },
    });
    if (error) {
      if (error.message.includes("already registered")) {
        return { error: "البريد الإلكتروني مسجل بالفعل" };
      }
      return { error: "حدث خطأ أثناء إنشاء الحساب: " + error.message };
    }
    success = true;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { error: "حدث خطأ أثناء إنشاء الحساب: " + msg };
  }
  if (success) {
    redirect("/dashboard");
  }
  return {};
}

export async function logout(): Promise<void> {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch {
    // Best-effort sign out — always redirect to login
  }
  redirect("/login");
}
