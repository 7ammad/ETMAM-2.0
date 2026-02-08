import { NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const protectedRoutePrefixes = ["/dashboard", "/tenders", "/settings"];
const publicAuthRoutes = ["/login", "/register"];

function isProtectedPath(pathname: string): boolean {
  return protectedRoutePrefixes.some((prefix) =>
    pathname === prefix || pathname.startsWith(prefix + "/")
  );
}

function isPublicAuthPath(pathname: string): boolean {
  return publicAuthRoutes.includes(pathname);
}

function copyCookies(from: NextResponse, to: NextResponse): void {
  const setCookie = from.headers.getSetCookie();
  setCookie.forEach((cookie) => {
    to.headers.append("Set-Cookie", cookie);
  });
}

/**
 * Next.js 16 proxy (replaces middleware.ts).
 * Runs on Node.js runtime. Refreshes Supabase session and enforces route protection.
 */
export async function proxy(request: NextRequest) {
  const { response, user } = await updateSession(request);
  const pathname = request.nextUrl.pathname;

  // Protected routes: redirect unauthenticated to login
  if (isProtectedPath(pathname) && !user) {
    const redirectResponse = NextResponse.redirect(
      new URL("/login", request.url)
    );
    copyCookies(response, redirectResponse);
    return redirectResponse;
  }

  // Public auth routes: redirect authenticated to dashboard
  if (isPublicAuthPath(pathname) && user) {
    const redirectResponse = NextResponse.redirect(
      new URL("/dashboard", request.url)
    );
    copyCookies(response, redirectResponse);
    return redirectResponse;
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|ico|jpg|jpeg|gif|webp)$).*)"],
};
