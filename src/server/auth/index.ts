import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { db } from "~/server/db";
import * as discord from "./providers/discord";
import * as github from "./providers/github";
import * as google from "./providers/google";
import { callbackSchema } from "./schema";

/**
 * Starts the OAuth flow with a specified provider.
 * @param provider One of `"google"`, `"discord"`, or `"github"`
 * @param callbackPath Where to navigate the user after the OAuth flow is complete
 */
export async function authenticate(
  provider: "google" | "discord" | "github",
  callbackPath: string,
) {
  if (provider !== "google") {
    await expectSession(null, {});
  }

  switch (provider) {
    case "google":
      return google.requestAuthorization(callbackPath);
    case "discord":
      return discord.requestAuthorization(callbackPath);
    case "github":
      return github.requestAuthorization(callbackPath);
  }
}

/**
 * Gets the currently signed in user.
 * @param include Drizzle relational query `with` clause for the session record.
 * @returns `null` if the user is not signed in, otherwise the session.
 */
export async function getSession<
  T extends (Parameters<typeof db.query.sessions.findFirst>[0] & {})["with"],
>(include: T) {
  const token = (await cookies()).get("session")?.value;

  if (!token) return null;

  const session = await db.query.sessions.findFirst({
    where: { token: { eq: token } },
    with: include,
  });

  return session ?? null;
}

/**
 * Gets the currently signed in user, redirecting or throwing if absent.
 * @param callbackPath Where to return after signing in. Pass `null` to throw
 *   a 404 instead of redirecting.
 * @param include Drizzle relational query `with` clause for the session record.
 * @returns The session.
 */
export async function expectSession<
  T extends (Parameters<typeof db.query.sessions.findFirst>[0] & {})["with"],
>(callbackPath: string | null, include: T) {
  const token = (await cookies()).get("session")?.value;

  if (!token) {
    if (callbackPath === null) notFound();
    return await authenticate("google", callbackPath);
  }

  const session = await db.query.sessions.findFirst({
    where: { token: { eq: token } },
    with: include,
  });

  if (!session) {
    if (callbackPath === null) notFound();
    return await authenticate("google", callbackPath);
  }

  return session;
}

/**
 * Handles GET `/api/auth` — the OAuth callback for GitHub and Discord.
 * Google's callback is handled separately at `/api/auth/callback` (Supabase
 * PKCE flow).
 */
export async function handleOAuthRedirect(request: NextRequest) {
  const params = await callbackSchema
    .parseAsync(request.nextUrl.searchParams)
    .catch((e) => {
      console.error(e);
      notFound();
    });

  if (!params.state) {
    notFound();
  }

  if (params.state.provider === "github") {
    const session = await expectSession(null, {});
    await github.linkProfile(params.code, session.userId);
    redirect(params.state.callbackPath);
  }

  if (params.state.provider === "discord") {
    const session = await expectSession(null, {
      user: { columns: {}, with: { publicProfile: true } },
    });
    await discord.linkProfile(params.code, session.user.publicProfile);
    redirect(params.state.callbackPath);
  }

  notFound();
}
