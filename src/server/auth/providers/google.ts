import { redirect } from "next/navigation";
import { db } from "~/server/db";
import { publicProfiles, sessions, users } from "~/server/db/schema/tables";
import { createSupabaseServerClient } from "~/server/supabase";

/**
 * Redirects the user to `/api/auth/google`, which initiates the Supabase PKCE
 * OAuth flow for Google sign-in. The split into a dedicated Route Handler is
 * necessary because PKCE cookies must be written before the redirect to
 * Supabase — an operation that is only permitted inside Route Handlers, not
 * Server Components.
 * @param callbackPath Where to send the user after sign-in completes.
 */
export function requestAuthorization(callbackPath: string): never {
  redirect(
    "/api/auth/google?" + new URLSearchParams({ callbackPath }).toString(),
  );
}

/**
 * Exchanges a Supabase OAuth code for a DevDogs session. Creates the user and
 * their public profile if this is their first sign-in.
 * @param code The authorization code forwarded from the Supabase OAuth callback.
 * @param userAgent The user-agent string to associate with the new session.
 * @returns The newly created session token.
 * @see `requestAuthorization`
 */
export async function createSession(
  code: string,
  userAgent: string | null,
): Promise<string> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.exchangeCodeForSession(code);

  if (error ?? !user?.email) {
    throw new Error("Failed to exchange Supabase OAuth code for session");
  }

  if (!user.email.endsWith("@uga.edu")) {
    throw new Error("Only @uga.edu accounts are permitted");
  }

  const ugaMyId = user.email.split("@")[0]!;
  const legalName =
    (user.user_metadata.full_name as string | undefined) ??
    (user.user_metadata.name as string | undefined) ??
    ugaMyId;

  return db.transaction(async (tx) => {
    const userId = await tx.transaction(async (tx2) => {
      const existingUser = await tx2.query.users.findFirst({
        where: { ugaMyId: { eq: ugaMyId } },
        columns: { id: true },
      });

      if (existingUser) return existingUser.id;

      const [insertedUser] = await tx2
        .insert(users)
        .values({ ugaMyId, legalName })
        .returning({ id: users.id });

      if (!insertedUser) return tx2.rollback();

      await tx2.insert(publicProfiles).values({
        userId: insertedUser.id,
        name: legalName.split(" ")[0] ?? "",
      });

      return insertedUser.id;
    });

    const [insertedSession] = await tx
      .insert(sessions)
      .values({ userId, userAgent })
      .returning({ token: sessions.token });

    if (!insertedSession) return tx.rollback();

    return insertedSession.token;
  });
}
