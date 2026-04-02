import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import z from "zod";
import { env } from "~/env";
import { db } from "~/server/db";
import {
  discordProfiles,
  oauthStates,
  SERVER_ONLY_DO_NOT_LEAK_accessTokens,
  users,
  type publicProfiles,
} from "~/server/db/schema/tables";
import { tokenResultSchema } from "../schema";

const OAUTH_REDIRECT_URI = new URL("/api/auth", env.BASE_URL).toString();

/**
 * Inserts a CSRF state token and redirects the user to Discord's OAuth consent
 * page. On success Discord redirects back to `/api/auth` with `code` and
 * `state` search parameters.
 * @param callbackPath Where to send the user after profile linking completes.
 */
export async function requestAuthorization(
  callbackPath: string,
): Promise<never> {
  const [insertedState] = await db
    .insert(oauthStates)
    .values({ callbackPath, provider: "discord" })
    .returning({ token: oauthStates.token });

  if (!insertedState) throw new Error("Failed to insert OAuth state");

  redirect(
    "https://discord.com/api/oauth2/authorize?" +
      new URLSearchParams({
        state: insertedState.token,
        redirect_uri: OAUTH_REDIRECT_URI,
        response_type: "code",
        client_id: env.DISCORD_CLIENT_ID,
        scope: "identify guilds.join",
      }).toString(),
  );
}

const profileSchema = z.object({
  id: z.string(),
  username: z.string(),
  avatar: z.string().nullish(),
});

/**
 * Exchanges the authorization code for tokens, fetches the Discord profile,
 * adds the user to the DevDogs guild, and links the profile to a DevDogs user.
 * @param authorizationCode The authorization code obtained via OAuth.
 * @param publicProfile The public profile of the user to link to (their `name`
 *   is used to set their Discord nickname in the guild).
 * @see `requestAuthorization`
 */
export async function linkProfile(
  authorizationCode: string,
  publicProfile: typeof publicProfiles.$inferSelect,
): Promise<void> {
  const tokens = await fetch("https://discord.com/api/oauth2/token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: env.DISCORD_CLIENT_ID,
      client_secret: env.DISCORD_CLIENT_SECRET,
      code: authorizationCode,
      redirect_uri: OAUTH_REDIRECT_URI,
      grant_type: "authorization_code",
    }).toString(),
  })
    .then((res) => res.json())
    .then((obj) => tokenResultSchema.parseAsync(obj));

  const profile = await fetch("https://discord.com/api/users/@me", {
    headers: { Authorization: "Bearer " + tokens.accessToken },
  })
    .then((res) => res.json())
    .then((obj) => profileSchema.parseAsync(obj));

  // Add the Discord user to the DevDogs guild
  await fetch(
    `https://discord.com/api/guilds/${env.DISCORD_GUILD_ID}/members/${profile.id}`,
    {
      method: "PUT",
      headers: {
        Accept: "application/json",
        Authorization: `Bot ${env.DISCORD_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        access_token: tokens.accessToken,
        nick: publicProfile.name,
        roles: [],
      }),
    },
  );

  await db.transaction(async (tx) => {
    const [insertedRow] = await tx
      .insert(SERVER_ONLY_DO_NOT_LEAK_accessTokens)
      .values(tokens)
      .returning({ id: SERVER_ONLY_DO_NOT_LEAK_accessTokens.id });

    if (!insertedRow) return tx.rollback();

    await tx
      .insert(discordProfiles)
      .values({ ...profile, accessTokenId: insertedRow.id });

    await tx
      .update(users)
      .set({ discordId: profile.id })
      .where(eq(users.id, publicProfile.userId));
  });
}

/**
 * Removes a Discord user from the DevDogs guild and unlinks their profile from
 * the database.
 * @param discordId The Discord user ID to remove.
 */
export async function unlinkProfile(discordId: string): Promise<void> {
  // TODO: fix permissions in Discord for this to work
  const result = await fetch(
    `https://discord.com/api/guilds/${env.DISCORD_GUILD_ID}/members/${discordId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bot ${env.DISCORD_TOKEN}`,
        "X-Audit-Log-Reason": "Unlinked Discord account on devdogsuga.org",
      },
    },
  );

  console.log(result);

  await db.delete(discordProfiles).where(eq(discordProfiles.id, discordId));
}
