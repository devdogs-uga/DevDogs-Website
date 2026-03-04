"use server";

import { createId } from "@paralleldrive/cuid2";
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import { expectSession } from "../auth";
import { db } from "../db";
import { oauthKeys } from "../db/schema/tables";
import { generateSecureString } from "../utilts";
import { env } from "~/env";

export default async function resetOAuthSecret() {
  const session = await expectSession("/settings/keys", {});
  const clientId = createId();
  const clientSecret = "ddk_" + generateSecureString(64);

  await db
    .update(oauthKeys)
    .set({
      clientId,
      clientSecret: await bcrypt.hash(clientSecret, env.BCRYPT_ROUNDS),
    })
    .where(eq(oauthKeys.userId, session.userId));

  return { clientId, clientSecret };
}
