"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export type AuthResult = {
  error?: string;
};

export async function login(
  _prevState: AuthResult | null,
  formData: FormData
): Promise<AuthResult> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email?.trim() || !password) {
    return { error: "البريد الإلكتروني وكلمة المرور مطلوبان" };
  }

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
      return { error: "حدث خطأ أثناء تسجيل الدخول" };
    }
    success = true;
  } catch {
    return { error: "حدث خطأ أثناء تسجيل الدخول" };
  }
  if (success) {
    redirect("/dashboard");
  }
  return {};
}

export async function register(
  _prevState: AuthResult | null,
  formData: FormData
): Promise<AuthResult> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const fullName = formData.get("fullName") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!email?.trim() || !password || !fullName?.trim()) {
    return { error: "جميع الحقول مطلوبة" };
  }
  if (password.length < 6) {
    return { error: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" };
  }
  if (password !== confirmPassword) {
    return { error: "كلمات المرور غير متطابقة" };
  }

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
      return { error: "حدث خطأ أثناء إنشاء الحساب" };
    }
    success = true;
  } catch {
    return { error: "حدث خطأ أثناء إنشاء الحساب" };
  }
  if (success) {
    redirect("/dashboard");
  }
  return {};
}

export async function logout(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
