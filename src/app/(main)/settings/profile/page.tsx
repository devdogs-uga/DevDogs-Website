import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import Avatar from "~/components/Avatar";
import ConnectedAccounts from "~/components/ConnectedAccounts";
import ProfileIdentity from "~/components/ProfileIdentity";
import ProfileLinks from "~/components/ProfileLinks";
import SettingsNavigation from "~/components/SettingsNavigation";
import { expectUserWith } from "~/server/auth";
import { db } from "~/server/db";
import { profiles } from "~/server/db/schema/public";

function getIdentityUserName(identityData: unknown) {
  return identityData &&
    typeof identityData === "object" &&
    "user_name" in identityData &&
    typeof identityData.user_name === "string"
    ? identityData.user_name
    : undefined;
}

export default async function Settings() {
  const user = await expectUserWith({
    profile: {
      with: { links: true },
    },
    githubIdentity: { columns: { identityData: true } },
    discordIdentity: { columns: { identityData: true } },
  }).catch(() => redirect("/api/auth"));

  if (!user.profile?.viewedSettings) {
    await db
      .update(profiles)
      .set({ viewedSettings: true })
      .where(eq(profiles.userId, user.id));
  }

  return (
    <SettingsNavigation title="Profile" pathname="/settings/profile">
      <section className="w-full overflow-hidden rounded-md border border-zinc-800">
        <div className="flex flex-col gap-4 bg-zinc-900 px-4 py-5 inset-shadow-sm">
          <h3 className="text-xl font-bold">Profile Photo</h3>
          <span className="text-[4rem]">
            <Avatar
              editable
              userId={user.id}
              preferredName={user.profile.preferredName}
            />
          </span>
        </div>
        <div className="flex items-center border-t border-zinc-800 bg-black px-4 py-3">
          <p className="text-xs text-zinc-500">
            JPEG · PNG · GIF · WEBP · AVIF &nbsp;·&nbsp; Max 5 MB
          </p>
        </div>
      </section>

      <ProfileIdentity
        userId={user.id}
        initialName={user.profile.preferredName}
        email={user.email ?? undefined}
      />

      <ProfileLinks initialLinks={user.profile.links} />

      <ConnectedAccounts
        userId={user.id}
        githubLogin={getIdentityUserName(user.githubIdentity?.identityData)}
        discordUsername={getIdentityUserName(
          user.discordIdentity?.identityData,
        )}
        showGithub={user.profile.showGithub}
        showDiscord={user.profile.showDiscord}
      />
    </SettingsNavigation>
  );
}
