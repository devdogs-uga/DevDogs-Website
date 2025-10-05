import { eq, sql } from "drizzle-orm";
import { google } from "googleapis";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { db } from "~/server/db";
import { sessions, users } from "~/server/db/schema";
import { env } from "~/env";

export const googleOAuth2 = new google.auth.OAuth2(
  env.AUTH_GOOGLE_ID,
  env.AUTH_GOOGLE_SECRET,
  env.AUTH_REDIRECT_URL,
);

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

export async function handleOAuthRedirect(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");

  if (code === null) {
    notFound();
  }

  const { tokens } = await googleOAuth2.getToken(code);
  googleOAuth2.setCredentials(tokens);

  const profile = await google
    .oauth2({
      version: "v2",
      auth: googleOAuth2,
    })
    .userinfo.get({
      fields: "name,email",
    });

  if (!profile.data.email) {
    notFound();
  }

  const email = profile.data.email;

  const token = await db
    .transaction(async (tx) => {
      const [insertedUser] = await tx
        .insert(users)
        .values({
          email,
          name: profile.data.name ?? "UGA Student",
          image: profile.data.picture,
          type: "user",
        })
        .onDuplicateKeyUpdate({
          set: { id: sql`id` },
        })
        .$returningId();

      if (!insertedUser) {
        tx.rollback();
        throw new Error("🍸 How did we get here?");
      }

      const [insertedSession] = await tx
        .insert(sessions)
        .values({
          userId: insertedUser.id,
          userAgent: request.headers.get("user-agent"),
        })
        .$returningId();

      if (!insertedSession) {
        tx.rollback();
        throw new Error("🍸 How did we get here?");
      }

      return insertedSession.token;
    })
    .catch(() => {
      notFound();
    });

  console.log(token);
  (await cookies()).set("session", token);
  redirect("/");
}
