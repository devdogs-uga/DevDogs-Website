import type { User } from "@supabase/auth-js";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { env } from "~/env";
import { db } from "~/server/db";
import { onboarding, publicProfiles } from "~/server/db/schema/tables";
import { createSupabaseServerClient } from "~/server/supabase";

const CALLBACK_URL = new URL("/api/auth/callback", env.BASE_URL).toString();

export async function requestAuthorization(
  callbackPath: string,
): Promise<never> {
  const cookieStore = await cookies();
  const supabase = await createSupabaseServerClient();

  // Store the post-auth destination in a short-lived cookie so the callback
  // handler can redirect there after the Supabase round-trip.
  cookieStore.set("auth_callback_path", callbackPath, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });

  cookieStore.set("auth_intent", "sign-in:google", {
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
      queryParams: { hd: "uga.edu", access_type: "offline" },
    },
  });

  if (error ?? !data.url) {
    throw new Error("Failed to initiate Google OAuth via Supabase");
  }

  redirect(data.url);
}

/**
 * Ensures a DevDogs profile exists for the authenticated Supabase user.
 * Creates a public profile and onboarding record on first sign-in; no-ops on
 * repeat sign-ins.
 * @param user The Supabase user from the OAuth callback.
 * @see `requestAuthorization`
 */
export async function createUser(user: User): Promise<void> {
  if (!user.email?.endsWith("@uga.edu")) {
    throw new Error("Only @uga.edu accounts are permitted");
  }

  const ugaMyId = user.email.split("@")[0]!;
  const legalName =
    (user.user_metadata.full_name as string | undefined) ??
    (user.user_metadata.name as string | undefined) ??
    ugaMyId;

  await db.transaction(async (tx) => {
    await tx
      .insert(publicProfiles)
      .values({ userId: user.id, name: legalName.split(" ")[0] ?? "" })
      .onConflictDoNothing();

    await tx
      .insert(onboarding)
      .values({ userId: user.id, ugaMyId, legalName })
      .onConflictDoNothing();
  });
}
