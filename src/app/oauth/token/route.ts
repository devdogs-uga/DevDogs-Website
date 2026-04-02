import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import { unauthorized } from "next/navigation";
import type { NextRequest } from "next/server";
import { env } from "~/env";
import { db } from "~/server/db";
import { authorizationCodes, sessions } from "~/server/db/schema/tables";

/**
 * POST `/oauth/token` — DevDogs OAuth 2.0 token endpoint.
 *
 * Exchanges a valid authorization code for an access token. The access token
 * is a DevDogs session token that can be used with `GET /oauth/userinfo`.
 *
 * Accepts `application/x-www-form-urlencoded` with:
 * - `grant_type`    — must be `"authorization_code"`
 * - `client_id`     — the client's ID
 * - `client_secret` — the client's secret (plaintext; compared against the
 *                     bcrypt hash stored in the database)
 * - `code`          — the authorization code obtained from `/oauth/authorize`
 * - `redirect_uri`  — must match the URI used during authorization
 *
 * Returns a JSON object conforming to RFC 6749 §5.1:
 * ```json
 * { "access_token": "…", "token_type": "Bearer" }
 * ```
 */
export async function POST(request: NextRequest) {
  const data = await request.formData();
  const grantType = data.get("grant_type");
  const clientId = data.get("client_id");
  const clientSecret = data.get("client_secret");
  const code = data.get("code");
  const redirectUri = data.get("redirect_uri");

  if (
    grantType !== "authorization_code" ||
    typeof clientId !== "string" ||
    typeof clientSecret !== "string" ||
    typeof code !== "string" ||
    typeof redirectUri !== "string"
  ) {
    unauthorized();
  }

  // ── Shared auth client (devdogsuga.org apps) ──────────────────────────────
  if (
    clientId === env.SHARED_AUTH_CLIENT_ID &&
    clientSecret === env.SHARED_AUTH_CLIENT_SECRET
  ) {
    const authorization = await db.query.authorizationCodes.findFirst({
      where: {
        code: { eq: code },
        clientId: { isNull: true },
        redirectUri: { eq: redirectUri },
      },
      columns: { userId: true },
    });

    if (!authorization?.userId) unauthorized();

    await db.delete(authorizationCodes).where(eq(authorizationCodes.code, code));

    const [insertedSession] = await db
      .insert(sessions)
      .values({ userId: authorization.userId })
      .returning({ token: sessions.token });

    if (!insertedSession) unauthorized();

    return Response.json({
      access_token: insertedSession.token,
      token_type: "Bearer",
    });
  }

  // ── Third-party client ────────────────────────────────────────────────────
  const authorization = await db.query.authorizationCodes.findFirst({
    where: {
      code: { eq: code },
      clientId: { eq: clientId },
      redirectUri: { eq: redirectUri },
    },
    with: { client: true },
    columns: { userId: true },
  });

  if (
    !authorization?.userId ||
    !authorization.client ||
    !(await bcrypt.compare(clientSecret, authorization.client.clientSecret))
  ) {
    unauthorized();
  }

  await db.delete(authorizationCodes).where(eq(authorizationCodes.code, code));

  const [insertedSession] = await db
    .insert(sessions)
    .values({ userId: authorization.userId })
    .returning({ token: sessions.token });

  if (!insertedSession) unauthorized();

  return Response.json({
    access_token: insertedSession.token,
    token_type: "Bearer",
  });
}
