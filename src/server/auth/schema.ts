import * as z from "zod";
import { addSeconds } from "date-fns";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { oauthStates } from "../db/schema/tables";
import { env } from "~/env";

// ---------------------------------------------------------------------------
// /api/auth — GitHub / Discord provider callbacks
// ---------------------------------------------------------------------------

const providerCallback = z.object({
  code: z.string(),
  state: z
    .string()
    .transform(
      async (stateToken) =>
        await db.transaction(async (tx) => {
          const state = await tx.query.oauthStates.findFirst({
            where: { token: { eq: stateToken } },
          });
          await tx
            .delete(oauthStates)
            .where(eq(oauthStates.token, stateToken));
          return state;
        }),
    )
    .nonoptional(),
});

/**
 * Schema for GET `/api/auth` — validates and consumes the CSRF state token
 * from a GitHub or Discord OAuth callback.
 */
export const callbackSchema = z
  .instanceof(URLSearchParams)
  .transform((sp) => Object.fromEntries(sp.entries()))
  .pipe(providerCallback);

// ---------------------------------------------------------------------------
// /oauth/authorize — DevDogs OAuth server (authorization endpoint)
// ---------------------------------------------------------------------------

/** A third-party client is sending a user here to begin "Sign in with DevDogs". */
const beginAuthorization = z.union([
  z.object({
    redirect_uri: z.url({
      hostname:
        /(^localhost$)|(^0\.0\.0\.0$)|(^127\.)|(^192\.168\.)|(^10\.)|(^172\.1[6-9]\.)|(^172\.2[0-9]\.)|(^172\.3[0-1]\.)|(^::1$)|(^[fF][cCdD])/i,
    }),
    client_id: z.string(),
    state: z.string().optional(),
  }),
  z.object({
    redirect_uri: z.url({ hostname: /devdogsuga\.org$/i }),
    client_id: z.literal(env.SHARED_AUTH_CLIENT_ID!),
    state: z.string().optional(),
  }),
]);

/** The user has authenticated and is being sent back to complete the DevDogs OAuth flow. */
const completeAuthorization = z.object({
  authorization: z
    .string()
    .transform(
      async (code) =>
        await db.query.authorizationCodes.findFirst({
          where: { code: { eq: code } },
        }),
    )
    .nonoptional(),
});

/**
 * Schema for GET `/oauth/authorize` — handles both legs of the DevDogs OAuth
 * authorization code flow.
 */
export const authorizeSchema = z
  .instanceof(URLSearchParams)
  .transform((sp) => Object.fromEntries(sp.entries()))
  .pipe(z.union([beginAuthorization, completeAuthorization]));

// ---------------------------------------------------------------------------
// Shared
// ---------------------------------------------------------------------------

export const tokenResultSchema = z
  .object({
    access_token: z.string(),
    token_type: z.string().toLowerCase().pipe(z.literal("bearer")),
    expires_in: z.number().optional(),
    refresh_token: z.string().optional(),
  })
  .transform((obj) => ({
    accessToken: obj.access_token,
    accessTokenExpires: obj.expires_in
      ? addSeconds(Date.now(), obj.expires_in)
      : undefined,
    refreshToken: obj.refresh_token,
  }));
