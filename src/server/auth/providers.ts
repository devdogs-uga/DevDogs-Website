import z from "zod";
import { env } from "~/env";
import { userResult } from "../github/schema";
import * as schema from "~/server/db/schema";
import type { MySqlTable } from "drizzle-orm/mysql-core";
import type { tokenResultSchema } from ".";

interface OAuthProvider<
  Table extends Extract<(typeof schema)[keyof typeof schema], MySqlTable>,
> {
  clientId: string;
  clientSecret: string;
  consentRequest: {
    url: string;
    params: Record<string, string>;
  };
  tokensRequest: {
    url: string;
  };
  profileRequest: {
    url: string;
    validator: z.ZodType<
      Omit<Table["$inferInsert"], keyof z.output<typeof tokenResultSchema>>
    >;
  };
  table: Table;
  userRelationColumnName?: keyof (typeof schema)["users"]["$inferSelect"];
}

function OAuthProvider<
  const T extends Extract<(typeof schema)[keyof typeof schema], MySqlTable>,
  const C extends OAuthProvider<T>,
>(configuration: C) {
  return configuration;
}

export const google = OAuthProvider({
  name: "google",
  clientId: env.AUTH_GOOGLE_ID,
  clientSecret: env.AUTH_GOOGLE_SECRET,
  consentRequest: {
    url: "https://accounts.google.com/o/oauth2/v2/auth",
    params: {
      scope:
        "https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email",
      access_type: "online",
      include_granted_scopes: "true",
      hd: "uga.edu",
    },
  },
  tokensRequest: {
    url: "https://oauth2.googleapis.com/token",
  },
  profileRequest: {
    url: "https://www.googleapis.com/oauth2/v1/userinfo?alt=json",
    validator: z
      .object({
        email: z.string(),
        name: z.string(),
        picture: z.string().nullish(),
      })
      .transform((obj) => ({
        email: obj.email,
        name: obj.name,
        image: obj.picture,
      })),
  },
  table: schema.users,
});

export const discord = OAuthProvider({
  name: "discord",
  clientId: env.DISCORD_CLIENT_ID,
  clientSecret: env.DISCORD_CLIENT_SECRET,
  consentRequest: {
    url: "https://discord.com/api/oauth2/authorize",
    params: {
      scope: "identify guilds.join",
    },
  },
  tokensRequest: {
    url: "https://discord.com/api/oauth2/token",
  },
  profileRequest: {
    url: "https://discord.com/api/users/@me",
    validator: z.object({
      id: z.string(),
      username: z.string(),
      avatar: z.string(),
    }),
  },
  table: schema.discordProfiles,
  userRelationColumnName: "discordId",
});

export const github = OAuthProvider({
  name: "github",
  clientId: env.GITHUB_CLIENT_ID,
  clientSecret: env.GITHUB_CLIENT_SECRET,
  consentRequest: {
    url: "https://github.com/login/oauth/authorize",
    params: {
      scope: "read:org user:email",
    },
  },
  tokensRequest: {
    url: "https://github.com/login/oauth/access_token",
  },
  profileRequest: {
    url: "https://api.github.com/user",
    validator: userResult,
  },
  table: schema.githubProfiles,
  userRelationColumnName: "githubId",
});

/**
 * 
    fetch(, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: env.GITHUB_CLIENT_ID,
        client_secret: env.GITHUB_CLIENT_SECRET,
        code,
        grant_type,
        redirect_uri,
      }).toString(),
    }),
 */
