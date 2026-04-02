"use server";

import { createId } from "@paralleldrive/cuid2";
import bcrypt from "bcrypt";
import { sql } from "drizzle-orm";
import { env } from "~/env";
import { expectSession } from "../auth";
import { db } from "../db";
import { oauthKeys } from "../db/schema/tables";
import { generateSecureString } from "../utilts";

export default async function resetOAuthSecret() {
  const session = await expectSession("/settings/keys", {});
  const clientId = createId();
  const clientSecret = "ddk_" + generateSecureString(64);

  await db
    .insert(oauthKeys)
    .values({
      userId: session.userId,
      clientId,
      clientSecret: await bcrypt.hash(clientSecret, env.BCRYPT_ROUNDS),
      lastUpdated: new Date(),
    })
    .onConflictDoUpdate({
      target: oauthKeys.userId,
      set: {
        clientId: sql`excluded."clientId"`,
        clientSecret: sql`excluded."clientSecret"`,
        lastUpdated: sql`excluded."lastUpdated"`,
      },
    });

  return { clientId, clientSecret };
}
