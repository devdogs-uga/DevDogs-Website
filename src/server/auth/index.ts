import { addSeconds } from "date-fns";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { notFound, redirect, unauthorized } from "next/navigation";
import type { NextRequest } from "next/server";
import z from "zod";
import { env } from "~/env";
import { db } from "~/server/db";
import { oauthStates, sessions, users } from "~/server/db/schema";
import * as providers from "./providers";

/**
 * Gets the currently signed in user.
 * @param include Specify data to include or exclude for the signed-in user using a Drizzle soft-relation query.
 * @returns `null` if the user is not signed in, or an object with user data if the user is signed in.
 */
export async function getSessionUser<
  T extends Exclude<
    ((Parameters<typeof db.query.sessions.findFirst>[0] & {})["with"] & {
      // eslint-disable-next-line @typescript-eslint/no-empty-object-type
      user: {};
    })["user"],
    true
  >,
>(include?: T) {
  const token = (await cookies()).get("session")?.value;

  if (!token) {
    return null;
  }

  const session = await db.query.sessions.findFirst({
    where: eq(sessions.token, token),
    with: {
      user: include ?? true,
    },
  });

  return session ?? null;
}

const redirect_uri = new URL("/api/auth", env.BASE_URL).toString();
const response_type = "code";

export async function authenticate(
  realm: "google" | "discord" | "github",
  callbackPath?: string,
) {
  const [insertedState] = await db
    .insert(oauthStates)
    .values({
      realm,
      callbackPath,
    })
    .$returningId();

  if (!insertedState) {
    throw new Error("Failed to insert state into database.");
  }

  const provider = providers[realm];
  redirect(
    provider.consentRequest.url +
      "?" +
      new URLSearchParams({
        client_id: provider.clientId,
        redirect_uri,
        response_type,
        state: insertedState.token,
        ...provider.consentRequest.params,
      }).toString(),
  );
}

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

const searchParamsSchema = z
  .instanceof(URLSearchParams)
  .transform((sp) => Object.fromEntries(sp.entries()))
  .pipe(
    z.intersection(
      z.object({
        state: z
          .string()
          .transform(async (stateToken) =>
            db.query.oauthStates.findFirst({
              where: eq(oauthStates.token, stateToken),
            }),
          )
          .nonoptional(),
      }),
      z.union([
        z.object({ code: z.string() }),
        z.object({ linkProfile: z.string() }),
      ]),
    ),
  );

const grant_type = "authorization_code";

export async function handleOAuthRedirect(request: NextRequest) {
  const cookieStore = await cookies();
  const params = await searchParamsSchema
    .parseAsync(request.nextUrl.searchParams)
    .catch(() => unauthorized());

  const provider = providers[params.state.realm];

  if ("linkProfile" in params) {
    if (provider.name === "google") {
      notFound();
    }

    await db.transaction(async (tx) => {
      await tx
        .update(users)
        .set({ [provider.userRelationColumnName]: params.linkProfile });

      await tx
        .delete(oauthStates)
        .where(eq(oauthStates.token, params.state.token));
    });

    redirect(params.state.callbackPath);
  }

  const tokens = await fetch(provider.tokensRequest.url, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: provider.clientId,
      client_secret: provider.clientSecret,
      code: params.code,
      grant_type,
      redirect_uri,
    }).toString(),
  })
    .then((res) => res.json())
    .then((obj) => tokenResultSchema.parseAsync(obj));

  const profileData: unknown = await fetch(provider.profileRequest.url, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${tokens.accessToken}`,
    },
  }).then((res) => res.json());

  if (provider.name === "google") {
    const profile =
      await provider.profileRequest.validator.parseAsync(profileData);

    const token = await db
      .transaction(async (tx) => {
        const user =
          (await tx.query.users.findFirst({
            where: eq(users.email, profile.email),
            columns: { id: true },
          })) ??
          (await tx.insert(provider.table).values(profile).$returningId())[0];

        if (!user) {
          return tx.rollback();
        }

        const [insertedSession] = await tx
          .insert(sessions)
          .values({
            userId: user.id,
            userAgent: request.headers.get("user-agent"),
          })
          .$returningId();

        if (!insertedSession) {
          return tx.rollback();
        }

        await tx
          .delete(oauthStates)
          .where(eq(oauthStates.token, params.state.token));
        return insertedSession.token;
      })
      .catch((error) => {
        console.error(error);
        notFound();
      });

    cookieStore.set("session", token);
    redirect(params.state.callbackPath);
  }

  const profile =
    await provider.profileRequest.validator.parseAsync(profileData);
  const sessionToken = cookieStore.get("session")?.value;

  const token = await db
    .transaction(async (tx) => {
      const session = sessionToken
        ? await tx.query.sessions.findFirst({
            where: eq(sessions.token, sessionToken),
            with: { user: true },
          })
        : undefined;

      const user =
        session?.user ??
        (await tx.query.users.findFirst({
          where: eq(users[provider.userRelationColumnName], profile.id),
        }));

      await tx
        .insert(provider.table)
        .values({
          ...profile,
          ...tokens,
        })
        .onDuplicateKeyUpdate({
          set: tokens,
        });

      if (!user) {
        return null;
      }

      if (!user[provider.userRelationColumnName]) {
        await tx
          .update(users)
          .set({
            [provider.userRelationColumnName]: profile.id,
          })
          .where(eq(users.id, user.id));
      }

      const [insertedSession] = await tx
        .insert(sessions)
        .values({
          userId: user.id,
          userAgent: request.headers.get("user-agent"),
        })
        .$returningId();

      if (!insertedSession) {
        return tx.rollback();
      }

      await tx
        .delete(oauthStates)
        .where(eq(oauthStates.token, params.state.token));
      return insertedSession.token;
    })
    .catch((error) => {
      console.error(error);
      notFound();
    });

  if (token === null) {
    return await authenticate(
      "google",
      request.nextUrl.pathname +
        "?" +
        new URLSearchParams({
          state: params.state.token,
          linkProfile: profile.id.toString(),
        }).toString(),
    );
  }

  (await cookies()).set("session", token);
  redirect(params.state.callbackPath);
}
