import { unauthorized } from "next/navigation";
import type { NextRequest } from "next/server";
import { db } from "~/server/db";

/**
 * GET `/oauth/userinfo` — DevDogs OAuth 2.0 / OIDC userinfo endpoint.
 *
 * Returns the authenticated user's profile. Callers must supply the access
 * token obtained from `POST /oauth/token` as a Bearer token:
 * ```
 * Authorization: Bearer <access_token>
 * ```
 *
 * Response shape (OIDC-compatible):
 * ```json
 * {
 *   "sub":     "<ugaMyId>",
 *   "name":    "Display Name",
 *   "email":   "user@uga.edu",
 *   "picture": "https://…",
 *   "github":  "github-username",
 *   "discord": "discord-username"
 * }
 * ```
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");

  if (!authHeader?.startsWith("Bearer ")) unauthorized();

  const token = authHeader.slice("Bearer ".length);

  const session = await db.query.sessions.findFirst({
    where: { token: { eq: token } },
    with: {
      user: {
        columns: { ugaMyId: true },
        with: { publicProfile: true },
      },
    },
  });

  if (!session?.user) unauthorized();

  const { ugaMyId, publicProfile } = session.user;

  return Response.json({
    sub: ugaMyId,
    name: publicProfile?.name ?? null,
    email: publicProfile?.email ?? null,
    picture: publicProfile?.image ?? null,
    github: publicProfile?.githubUsername ?? null,
    discord: publicProfile?.discordUsername ?? null,
  });
}
