"use client";

import { useActionState } from "react";
import { login } from "@/app/actions/auth";
import Link from "next/link";
import { useLanguageStore } from "@/stores/language-store";
import { ts } from "@/lib/i18n";

const initialState: { error?: string } = { error: undefined };

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(login, initialState);
  const lang = useLanguageStore((s) => s.lang);

  return (
    <form action={formAction} className="w-full max-w-sm space-y-4">
      <div className="space-y-2">
        <label
          htmlFor="email"
          className="block text-sm font-medium text-foreground"
        >
          {ts("email", lang)}
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          dir="ltr"
          className="w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-500/40 transition-colors"
          placeholder="you@example.com"
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="password"
          className="block text-sm font-medium text-foreground"
        >
          {ts("password", lang)}
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          dir="ltr"
          className="w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-500/40 transition-colors"
        />
      </div>

      {state?.error && (
        <div
          role="alert"
          className="rounded-md bg-destructive/10 p-3 text-sm text-destructive"
        >
          {state.error}
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-lg bg-accent-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-400 disabled:opacity-50"
      >
        {isPending ? ts("loggingIn", lang) : ts("loginBtn", lang)}
      </button>

      <p className="text-center text-sm text-muted-foreground">
        {ts("noAccount", lang)}{" "}
        <Link href="/register" className="text-accent-500 hover:underline">
          {ts("createAccount", lang)}
        </Link>
      </p>
    </form>
  );
}
