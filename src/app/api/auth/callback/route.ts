import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import * as google from "~/server/auth/providers/google";

/**
 * Handles the Supabase OAuth callback for Google sign-in. Supabase redirects
 * here after the user authenticates with Google and the PKCE exchange is
 * complete.
 */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");

  if (!code) notFound();

  const cookieStore = await cookies();
  const callbackPath = cookieStore.get("auth_callback_path")?.value ?? "/";
  cookieStore.delete("auth_callback_path");

  const sessionToken = await google.createSession(
    code,
    request.headers.get("user-agent"),
  );

  cookieStore.set("session", sessionToken, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });

  redirect(callbackPath);
}
