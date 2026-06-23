"use client";

import { LinkedinLogoIcon, LinkBreakIcon } from "@phosphor-icons/react/ssr";
import { useAccountVisibility } from "~/hooks/useAccountVisibility";
import type { getProfilePageData } from "~/server/loaders/console";
import ConfirmDestructiveAction from "~/ui/confirm-destructive-action";
import FormButton from "~/components/FormButton";
import Input from "~/components/Input";
import VisibilityToggle from "~/ui/visibility-toggle";
import linkLinkedinProfile from "~/server/actions/linkLinkedinProfile";
import unlinkLinkedinProfile from "~/server/actions/unlinkLinkedinProfile";

type ProfileData = Awaited<ReturnType<typeof getProfilePageData>>;

function getIdentityName(identityData: unknown): string | undefined {
  if (!identityData || typeof identityData !== "object") return undefined;
  if ("name" in identityData && typeof identityData.name === "string") {
    return identityData.name;
  }
  const given =
    "given_name" in identityData && typeof identityData.given_name === "string"
      ? identityData.given_name
      : "";
  const family =
    "family_name" in identityData &&
    typeof identityData.family_name === "string"
      ? identityData.family_name
      : "";
  const full = [given, family].filter(Boolean).join(" ");
  return full || undefined;
}

export default function LinkedinField({
  id,
  linkedinIdentity,
  profile,
}: ProfileData) {
  const linkedinName = getIdentityName(linkedinIdentity?.identityData);
  const { showLinkedin, toggle, isPending } = useAccountVisibility(id, {
    showGithub: profile.showGithub,
    showDiscord: profile.showDiscord,
    showEmail: profile.showEmail,
    showLinkedin: profile.showLinkedin,
  });

  return (
    <div className="flex flex-col gap-3">
      {linkedinName ? (
        <>
          <VisibilityToggle
            checked={showLinkedin}
            pending={isPending("linkedin")}
            onToggle={() => toggle("linkedin")}
          />
          <Input
            className="max-w-sm"
            defaultValue={linkedinName}
            readOnly
            disabled
            type="text"
          />
          <div className="flex w-full max-w-sm justify-end">
            <ConfirmDestructiveAction
              action={unlinkLinkedinProfile}
              title="Unlink LinkedIn"
              description="Unlinking your LinkedIn account will remove it from your DevDogs profile."
              submitLabel="Unlink LinkedIn"
              userConfirmText="Unlink LinkedIn"
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
        <form className="contents" action={linkLinkedinProfile}>
          <input type="hidden" name="callbackPath" value="/account" />
          <p className="text-sm text-mauve-400">LinkedIn not linked.</p>
          <FormButton theme="black" className="w-fit text-sm">
            <LinkedinLogoIcon />
            Sign in with LinkedIn
          </FormButton>
        </form>
      )}
    </div>
  );
}
