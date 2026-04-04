import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import z from "zod";
import { env } from "~/env";
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

  cookieStore.set("auth_intent", "link:discord", {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });

  const { data, error } = await supabase.auth.linkIdentity({
    provider: "discord",
    options: {
      redirectTo: CALLBACK_URL,
      skipBrowserRedirect: true,
      scopes: "identify guilds.join",
    },
  });

  if (error ?? !data.url) {
    throw new Error("Failed to initiate Discord OAuth via Supabase");
  }

  redirect(data.url);
}

const profileSchema = z.object({
  id: z.string(),
  username: z.string(),
  avatar: z.string().nullish(),
});

/**
 * Fetches the Discord profile and adds the user to the DevDogs guild.
 * The identity link itself is managed by Supabase (`auth.identities`).
 * @param accessToken The Discord access token from the Supabase OAuth session.
 * @param publicProfile The public profile of the user (their `name` is used to
 *   set their Discord nickname in the guild).
 * @see `requestAuthorization`
 */
export async function linkProfile(
  accessToken: string,
  publicProfile: { name: string },
): Promise<void> {
  const profile = await fetch("https://discord.com/api/users/@me", {
    headers: { Authorization: "Bearer " + accessToken },
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
        access_token: accessToken,
        nick: publicProfile.name,
        roles: [],
      }),
    },
  );
}

/**
 * Removes a user's Discord identity from Supabase and removes them from the
 * DevDogs guild. The `provider_user_id` on the identity is the Discord
 * snowflake ID used for the guild API call.
 */
export async function unlinkProfile(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUserIdentities();

  const identity = data?.identities.find((i) => i.provider === "discord");

  if (!identity) return;

  // The Discord snowflake ID is stored as `identity_data.sub` by Supabase.
  const discordUserId: unknown = identity.identity_data?.sub;

  if (typeof discordUserId !== "string") {
    throw new Error("Discord identity is missing sub. Unlink aborted.");
  }

  // TODO: fix permissions in Discord for this to work
  const result = await fetch(
    `https://discord.com/api/guilds/${env.DISCORD_GUILD_ID}/members/${discordUserId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bot ${env.DISCORD_TOKEN}`,
        "X-Audit-Log-Reason": "Unlinked Discord account on devdogsuga.org",
      },
    },
  );

  if (!result.ok) {
    throw new Error(
      `Failed to remove user from Discord guild (${result.status}). Unlink aborted.`,
    );
  }

  await supabase.auth.unlinkIdentity(identity);
}
