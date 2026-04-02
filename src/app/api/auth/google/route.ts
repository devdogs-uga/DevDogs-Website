import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { env } from "~/env";

const CALLBACK_URL = new URL("/api/auth/callback", env.BASE_URL).toString();

/**
 * Initiates the Supabase PKCE OAuth flow for Google sign-in.
 *
 * This must be a Route Handler (not a Server Component) because the PKCE code
 * verifier is stored in a cookie before the redirect to Supabase — cookie
 * writes are forbidden inside Server Components.
 */
export async function GET(request: NextRequest) {
  const callbackPath =
    request.nextUrl.searchParams.get("callbackPath") ?? "/";

  const cookieStore = await cookies();

  const supabase = createServerClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options),
        );
      },
    },
  });

  // Store the post-auth destination in a short-lived cookie so the callback
  // handler can redirect there after the Supabase round-trip.
  cookieStore.set("auth_callback_path", callbackPath, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: CALLBACK_URL,
      skipBrowserRedirect: true,
      queryParams: { hd: "uga.edu" },
    },
  });

  if (error ?? !data.url) {
    throw new Error("Failed to initiate Google OAuth via Supabase");
  }

  redirect(data.url);
}
