import { eq, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import z from "zod";
import { env } from "~/env";
import { db } from "~/server/db";
import {
  githubProfiles,
  oauthStates,
  SERVER_ONLY_DO_NOT_LEAK_accessTokens,
  users,
} from "~/server/db/schema/tables";
import { tokenResultSchema } from "../schema";

const OAUTH_REDIRECT_URI = new URL("/api/auth", env.BASE_URL).toString();

/**
 * Inserts a CSRF state token and redirects the user to GitHub's OAuth consent
 * page. On success GitHub redirects back to `/api/auth` with `code` and
 * `state` search parameters.
 * @param callbackPath Where to send the user after profile linking completes.
 */
export async function requestAuthorization(
  callbackPath: string,
): Promise<never> {
  const [insertedState] = await db
    .insert(oauthStates)
    .values({ callbackPath, provider: "github" })
    .returning({ token: oauthStates.token });

  if (!insertedState) throw new Error("Failed to insert OAuth state");

  redirect(
    "https://github.com/login/oauth/authorize?" +
      new URLSearchParams({
        state: insertedState.token,
        redirect_uri: OAUTH_REDIRECT_URI,
        response_type: "code",
        client_id: env.GITHUB_CLIENT_ID,
        scope: "write:org user:email",
      }).toString(),
  );
}

const profileSchema = z.object({
  id: z.int(),
  login: z.string(),
  avatar_url: z.string(),
});

/**
 * Exchanges the authorization code for tokens, fetches the GitHub profile,
 * invites the user to the DevDogs organization, and links the profile to a
 * DevDogs user.
 * @param authorizationCode The authorization code obtained via OAuth.
 * @param userId The ID of the DevDogs user to associate this profile with.
 * @see `requestAuthorization`
 */
export async function linkProfile(
  authorizationCode: string,
  userId: string,
): Promise<void> {
  const tokens = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code: authorizationCode,
      redirect_uri: OAUTH_REDIRECT_URI,
      grant_type: "authorization_code",
    }).toString(),
  })
    .then((res) => res.json())
    .then((obj) => tokenResultSchema.parseAsync(obj));

  const profile = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: "Bearer " + tokens.accessToken,
      "X-GitHub-Api-Version": "2022-11-28",
    },
  })
    .then((res) => res.json())
    .then((obj) => profileSchema.parseAsync(obj));

  // Invite the GitHub user as a contributor to the DevDogs organization
  await fetch(`https://api.github.com/orgs/${env.GITHUB_ORG}/invitations`, {
    method: "POST",
    headers: {
      Authorization: "Bearer " + env.GITHUB_TOKEN,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    body: JSON.stringify({
      invitee_id: profile.id,
      role: "direct_member",
      team_ids: [14192632],
    }),
  })
    .then((res) => res.json())
    .then(console.log)
    .catch(console.error);

  // Accept the organization invitation on behalf of the user
  await fetch(
    "https://api.github.com/user/memberships/orgs/" + env.GITHUB_ORG,
    {
      method: "PATCH",
      headers: {
        Authorization: "Bearer " + tokens.accessToken,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      body: JSON.stringify({ state: "active" }),
    },
  )
    .then((res) => res.json())
    .then(console.log)
    .catch(console.error);

  await db.transaction(async (tx) => {
    const [insertedRow] = await tx
      .insert(SERVER_ONLY_DO_NOT_LEAK_accessTokens)
      .values(tokens)
      .returning({ id: SERVER_ONLY_DO_NOT_LEAK_accessTokens.id });

    if (!insertedRow) return tx.rollback();

    await tx
      .insert(githubProfiles)
      .values({ ...profile, accessTokenId: insertedRow.id })
      .onConflictDoUpdate({
        target: githubProfiles.id,
        set: { accessTokenId: sql`excluded."accessTokenId"` },
      });

    await tx
      .update(users)
      .set({ githubId: profile.id })
      .where(eq(users.id, userId));
  });
}

/**
 * Removes a GitHub user from the DevDogs organization and unlinks their
 * profile from the database.
 * @param githubLogin The GitHub username (login) to remove.
 */
export async function unlinkProfile(githubLogin: string): Promise<void> {
  await fetch(
    `https://api.github.com/orgs/${env.GITHUB_ORG}/memberships/${githubLogin}`,
    {
      method: "DELETE",
      headers: {
        Authorization: "Bearer " + env.GITHUB_TOKEN,
        "X-GitHub-Api-Version": "2022-11-28",
      },
    },
  );

  await db
    .delete(githubProfiles)
    .where(eq(githubProfiles.login, githubLogin));
}
