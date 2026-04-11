"use server";

import { eq } from "drizzle-orm";
import { z } from "zod";
import { zfd } from "zod-form-data";
import { supabaseAdmin } from "~/supabase/admin";
import { authenticate, expectSession, expectUserWith } from "../auth";
import { db } from "../db";
import { oauthTestAccounts } from "../db/schema/public";

const MAX_TEST_ACCOUNTS = 5;

const testAccountSchema = zfd.formData({
  displayName: zfd.text(z.string().min(1).max(255)),
});

const updateSchema = zfd.formData({
  testUserId: zfd.text(z.uuid()),
  displayName: zfd.text(z.string().min(1).max(255)),
});

export type TestAccount = {
  userId: string;
  displayName: string;
  createdAt: string;
};

export async function addTestAccount(formData: FormData) {
  const { displayName } = await testAccountSchema.parseAsync(formData);
  const user = await expectUserWith({
    testAccounts: true,
  }).catch(() => authenticate("google", "/settings/oauth"));

  if (user.testAccounts.length >= MAX_TEST_ACCOUNTS) {
    throw new Error(
      `A maximum of ${MAX_TEST_ACCOUNTS} test accounts are allowed`,
    );
  }

  // Use a unique synthetic email with the IANA-reserved .test TLD for the
  // auth.users row. This guarantees uniqueness and prevents any risk of
  // impersonation (a .test address can never belong to a real user).
  //
  // The user-specified display email and display name are stored in
  // user_metadata so OAuth clients can read them from the token or UserInfo
  // endpoint. The `name` JWT claim comes from user_metadata.full_name via
  // GoTrue's default OIDC claim mapping.
  const testUserId = crypto.randomUUID();
  const { data: createUser, error: createUserError } =
    await supabaseAdmin.auth.admin.createUser({
      id: testUserId,
      email: `${testUserId}@devdogsuga.test`,
      email_confirm: true,
      user_metadata: {
        is_test_account: true,
        name: displayName,
        full_name: displayName,
      },
    });

  if (createUserError ?? !createUser.user) {
    console.error({ createUserError });
    throw new Error("Failed to create test account.");
  }

  try {
    await db.insert(oauthTestAccounts).values({
      testUserId,
      ownerUserId: user.id,
    });
  } catch (insertError) {
    await supabaseAdmin.auth.admin.deleteUser(createUser.user.id);
    console.error({ insertError });
    throw new Error("Failed to create test account.");
  }

  return { testUserId, displayName };
}

export async function updateTestAccount(
  _prevState: unknown,
  formData: FormData,
) {
  const ownerUserId = await expectSession();
  const { testUserId, displayName } = await updateSchema.parseAsync(formData);

  const account = await db.query.oauthTestAccounts.findFirst({
    where: { ownerUserId, testUserId },
  });

  if (!account) {
    throw new Error("Test account not found");
  }

  const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
    testUserId,
    {
      user_metadata: {
        is_test_account: true,
        full_name: displayName,
      },
    },
  );

  if (updateError) {
    console.error({ updateError });
    throw new Error("Failed to update test user.");
  }

  return { testUserId, displayName };
}

export async function deleteTestAccount(testUserId: string): Promise<void> {
  const ownerUserId = await expectSession();

  const account = await db.query.oauthTestAccounts.findFirst({
    where: { ownerUserId, testUserId },
  });

  if (!account) {
    throw new Error("Test account not found");
  }

  await supabaseAdmin.auth.admin.deleteUser(testUserId);

  await db
    .delete(oauthTestAccounts)
    .where(eq(oauthTestAccounts.testUserId, testUserId));
}
