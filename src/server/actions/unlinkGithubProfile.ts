"use server";
import { eq } from "drizzle-orm";
import { refresh } from "next/cache";
import { authenticate, expectUserWith } from "../auth";
import { unlinkProfile } from "../auth/providers/github";
import { db } from "../db";
import { oauthRegistrations } from "../db/schema/public";
import { supabaseAdmin } from "../../supabase/admin";

export default async function unlinkGithubProfile() {
  const user = await expectUserWith({
    profile: { with: { oauthClient: true } },
  }).catch(() => authenticate("google", "/settings/profile"));

  const clientId = user.profile?.oauthClient?.clientId;
  if (clientId) {
    await db.transaction(async (tx) => {
      await tx
        .delete(oauthRegistrations)
        .where(eq(oauthRegistrations.userId, user.id));
      await supabaseAdmin.auth.admin.oauth.deleteClient(clientId);
    });
  }

  await unlinkProfile();
  refresh();
}
