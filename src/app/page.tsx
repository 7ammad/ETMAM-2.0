import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { createClient } from "@/lib/supabase/server";
import { LandingPage } from "@/components/landing/LandingPage";

export default async function Home() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      redirect("/dashboard");
    }
  } catch (error: unknown) {
    // Next.js redirect() throws a special error — must re-throw it
    if (isRedirectError(error)) {
      throw error;
    }
    // Supabase unreachable (network/CORS) — fall through to landing page
    console.warn("Supabase auth check failed, showing landing page:", error);
  }

  return <LandingPage />;
}
