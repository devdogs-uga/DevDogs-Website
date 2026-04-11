import { redirect } from "next/navigation";
import OAuthKeys from "~/components/OAuthKeys";
import OAuthTestAccounts from "~/components/OAuthTestAccounts";
import SettingsNavigation from "~/components/SettingsNavigation";
import type { TestAccount } from "~/server/actions/testAccounts";
import { expectUserWith } from "~/server/auth";
import { supabaseAdmin } from "~/supabase/admin";

export default async function OAuth() {
  const { profile, githubIdentity, testAccounts } = await expectUserWith({
    profile: {
      with: {
        oauthRegistration: {
          with: {},
        },
      },
    },
    githubIdentity: { columns: { id: true } },
    testAccounts: {
      columns: {
        createdAt: true,
      },
      with: {
        user: {
          columns: {
            id: true,
            rawUserMetaData: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    },
  }).catch(() => redirect("/api/auth"));

  const clientId = profile?.oauthRegistration?.clientId ?? null;

  const redirectUris: string[] = [];

  if (clientId) {
    const { data } = await supabaseAdmin.auth.admin.oauth.getClient(clientId);
    if (data) redirectUris.push(...data.redirect_uris);
  }

  return (
    <SettingsNavigation title="OAuth" pathname="/settings/oauth">
      <section className="w-full overflow-hidden rounded-md border border-zinc-800">
        <OAuthKeys
          clientId={clientId}
          redirectUris={redirectUris}
          hasGithub={githubIdentity !== null}
        />
      </section>

      {clientId && (
        <OAuthTestAccounts
          initialAccounts={testAccounts.map(
            ({ user, createdAt }) =>
              ({
                userId: user.id,
                displayName:
                  user.rawUserMetaData &&
                  typeof user.rawUserMetaData === "object" &&
                  "display_name" in user.rawUserMetaData &&
                  typeof user.rawUserMetaData.display_name === "string"
                    ? user.rawUserMetaData.display_name
                    : "Test User",
                createdAt: createdAt.toISOString(),
              }) satisfies TestAccount,
          )}
        />
      )}
    </SettingsNavigation>
  );
}
