import { eq } from "drizzle-orm";
import { redirect, unauthorized } from "next/navigation";
import type { NextRequest } from "next/server";
import { expectSession } from "~/server/auth";
import { db } from "~/server/db";
import { authorizationCodes } from "~/server/db/schema/tables";
import { authorizeSchema } from "~/server/auth/schema";
import { env } from "~/env";

/**
 * GET `/oauth/authorize` — DevDogs OAuth 2.0 authorization endpoint.
 *
 * Handles two legs of the authorization code flow:
 *
 * 1. **Begin** — a third-party client sends a user here with `redirect_uri`,
 *    `client_id`, and an optional `state`. A pending authorization code is
 *    created and the user is sent to the sign-in flow if needed.
 *
 * 2. **Complete** — after the user signs in they return here via
 *    `?authorization=<code>`. The code is stamped with their user ID and they
 *    are redirected back to the client's `redirect_uri`.
 */
export async function GET(request: NextRequest) {
  const params = await authorizeSchema
    .parseAsync(request.nextUrl.searchParams)
    .catch((e) => {
      console.error(e);
      unauthorized();
    });

  // Leg 1: begin authorization — insert a code and send the user to sign in.
  if ("redirect_uri" in params) {
    const [insertedAuthorization] = await db
      .insert(authorizationCodes)
      .values({
        clientId:
          params.client_id !== env.SHARED_AUTH_CLIENT_ID
            ? params.client_id
            : null,
        redirectUri: params.redirect_uri,
        state: params.state,
      })
      .returning({ code: authorizationCodes.code })
      .catch(() =>
        // A failed insert almost always means the clientId FK constraint
        // rejected a phony client ID.
        unauthorized(),
      );

    if (!insertedAuthorization) unauthorized();

    redirect(
      "/oauth/authorize?" +
        new URLSearchParams({
          authorization: insertedAuthorization.code,
        }).toString(),
    );
  }

  // Leg 2: complete authorization — stamp the code with the signed-in user.
  const session = await expectSession(
    "/oauth/authorize?" +
      new URLSearchParams({
        authorization: params.authorization.code,
      }).toString(),
    {},
  );

  const [result] = await db
    .update(authorizationCodes)
    .set({ userId: session.userId })
    .where(eq(authorizationCodes.code, params.authorization.code))
    .returning({ code: authorizationCodes.code });

  if (!result) unauthorized();

  redirect(
    new URL(
      "?" +
        new URLSearchParams({
          code: params.authorization.code,
          state: params.authorization.state ?? "",
        }).toString(),
      params.authorization.redirectUri,
    ).toString(),
  );
}
