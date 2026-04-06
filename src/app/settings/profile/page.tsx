import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { PiEnvelopeSimpleBold, PiUserBold } from "react-icons/pi";
import * as z from "zod";
import * as zfd from "zod-form-data";
import ConnectedAccounts from "~/components/ConnectedAccounts";
import FormButton from "~/components/FormButton";
import IconInput from "~/components/IconInput";
import ProfileLinks from "~/components/ProfileLinks";
import SettingsNavigation from "~/components/SettingsNavigation";
import { authenticate, expectSession, expectUserWith } from "~/server/auth";
import { db } from "~/server/db";
import { profiles } from "~/server/db/schema/tables";

async function updatePreferredName(formData: FormData) {
  "use server";

  const userId = await expectSession().catch(() =>
    authenticate("google", "/settings/profile"),
  );

  const { preferredName } = await zfd
    .formData({ preferredName: zfd.text(z.string().min(1).max(32)) })
    .parseAsync(formData);

  await db
    .update(profiles)
    .set({ preferredName })
    .where(eq(profiles.userId, userId));

  revalidatePath("/settings/profile");
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

  const githubLogin = user.githubIdentity?.identityData?.user_name;
  const discordLogin = user.discordIdentity?.identityData?.user_name;

  return (
    <SettingsNavigation title="Profile" pathname="/settings/profile">
      <section className="w-full overflow-hidden rounded-md border border-zinc-800">
        <form className="contents" action={updatePreferredName}>
          <div className="flex flex-col gap-4 bg-zinc-900 px-4 py-5 inset-shadow-sm">
            <h3 className="text-xl font-bold">Identity</h3>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-zinc-300">
                Preferred Name
              </label>
              <IconInput
                icon={<PiUserBold />}
                defaultValue={user.profile?.preferredName ?? ""}
                minLength={1}
                maxLength={32}
                name="preferredName"
                type="text"
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-zinc-300">
                Email
              </label>
              <IconInput
                icon={<PiEnvelopeSimpleBold />}
                value={user.email ?? ""}
                readOnly
                disabled
                type="email"
              />
            </div>
          </div>
          <div className="flex items-center justify-between gap-4 border-t border-zinc-800 bg-black p-4 font-medium">
            <p className="max-w-prose text-sm text-zinc-400">
              Your email is set by your UGA Google account and cannot be changed
              here.
            </p>

            <FormButton className="rounded-sm bg-purple-900 px-4 py-1 ring-purple-950 hover:not-disabled:bg-purple-200 hover:not-disabled:text-purple-950">
              Save
            </FormButton>
          </div>
        </form>
      </section>

      <ProfileLinks initialLinks={user.profile?.links ?? []} />

      <ConnectedAccounts
        githubLogin={githubLogin}
        discordUsername={discordLogin}
        showGithub={user.profile?.showGithub ?? false}
        showDiscord={user.profile?.showDiscord ?? false}
      />
    </SettingsNavigation>
  );
}
