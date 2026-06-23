"use client";

import { GithubLogoIcon, LinkBreakIcon } from "@phosphor-icons/react/ssr";
import { useAccountVisibility } from "~/hooks/useAccountVisibility";
import type { getProfilePageData } from "~/server/loaders/console";
import ConfirmDestructiveAction from "~/ui/confirm-destructive-action";
import FormButton from "~/components/FormButton";
import Input from "~/components/Input";
import VisibilityToggle from "~/ui/visibility-toggle";
import linkGithubProfile from "~/server/actions/linkGithubProfile";
import unlinkGithubProfile from "~/server/actions/unlinkGithubProfile";

type ProfileData = Awaited<ReturnType<typeof getProfilePageData>>;

function getIdentityUserName(identityData: unknown): string | undefined {
  return identityData &&
    typeof identityData === "object" &&
    "user_name" in identityData &&
    typeof identityData.user_name === "string"
    ? identityData.user_name
    : undefined;
}

export default function GithubField({
  id,
  githubIdentity,
  profile,
}: ProfileData) {
  const githubLogin = getIdentityUserName(githubIdentity?.identityData);
  const { showGithub, toggle, isPending } = useAccountVisibility(id, {
    showGithub: profile.showGithub,
    showDiscord: profile.showDiscord,
    showEmail: profile.showEmail,
    showLinkedin: profile.showLinkedin,
  });

  return (
    <div className="flex flex-col gap-3">
      {githubLogin ? (
        <>
          <VisibilityToggle
            checked={showGithub}
            pending={isPending("github")}
            onToggle={() => toggle("github")}
          />
          <Input
            className="max-w-sm"
            defaultValue={"github.com/" + githubLogin}
            readOnly
            disabled
            type="text"
          />
          <div className="flex w-full max-w-sm justify-end">
            <ConfirmDestructiveAction
              action={unlinkGithubProfile}
              title="Unlink GitHub"
              description="Unlinking your GitHub account will remove you from the DevDogs organization and revoke your access to this year's project repositories. If you have an active OAuth client, it will be deleted, and your existing client ID and secret will be permanently invalidated."
              submitLabel="Unlink GitHub"
              userConfirmText="Unlink GitHub"
            >
              <FormButton
                theme="rose"
                type="submit"
                className="text-sm text-nowrap"
              >
                <LinkBreakIcon />
                Unlink Account
              </FormButton>
            </ConfirmDestructiveAction>
          </div>
        </>
      ) : (
        <form className="contents" action={linkGithubProfile}>
          <input type="hidden" name="callbackPath" value="/account" />
          <p className="text-sm text-mauve-400">GitHub not linked.</p>
          <FormButton theme="black" className="w-fit text-sm">
            <GithubLogoIcon />
            Sign in with GitHub
          </FormButton>
        </form>
      )}
    </div>
  );
}
