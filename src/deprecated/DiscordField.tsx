"use client";

import { GameControllerIcon, ChatCircleIcon, LinkBreakIcon } from "@phosphor-icons/react/ssr";
import { useAccountVisibility } from "~/hooks/useAccountVisibility";
import type { getProfilePageData } from "~/server/loaders/console";
import ConfirmDestructiveAction from "~/ui/confirm-destructive-action";
import FormButton from "~/components/FormButton";
import Input from "~/components/Input";
import VisibilityToggle from "~/ui/visibility-toggle";
import linkDiscordProfile from "~/server/actions/linkDiscordProfile";
import unlinkDiscordProfile from "~/server/actions/unlinkDiscordProfile";

type ProfileData = Awaited<ReturnType<typeof getProfilePageData>>;

function getIdentityUserName(identityData: unknown): string | undefined {
  return identityData &&
    typeof identityData === "object" &&
    "user_name" in identityData &&
    typeof identityData.user_name === "string"
    ? identityData.user_name
    : undefined;
}

export default function DiscordField({
  id,
  discordIdentity,
  profile,
}: ProfileData) {
  const discordUsername = getIdentityUserName(discordIdentity?.identityData);
  const { showDiscord, toggle, isPending } = useAccountVisibility(id, {
    showGithub: profile.showGithub,
    showDiscord: profile.showDiscord,
    showEmail: profile.showEmail,
    showLinkedin: profile.showLinkedin,
  });

  return (
    <div className="flex flex-col gap-3">
      {discordUsername ? (
        <>
          <VisibilityToggle
            checked={showDiscord}
            pending={isPending("discord")}
            onToggle={() => toggle("discord")}
          />
          <Input
            className="max-w-sm"
            defaultValue={discordUsername}
            readOnly
            disabled
            type="text"
          />
          <div className="flex w-full max-w-sm justify-end">
            <ConfirmDestructiveAction
              action={unlinkDiscordProfile}
              title="Unlink Discord"
              description="Unlinking your Discord account will remove you from the DevDogs server."
              submitLabel="Unlink Discord"
              userConfirmText="Unlink Discord"
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
        <form className="contents" action={linkDiscordProfile}>
          <input type="hidden" name="callbackPath" value="/account" />
          <p className="text-sm text-mauve-400">Discord not linked.</p>
          <FormButton theme="black" className="w-fit text-sm">
            <GameControllerIcon />
            Sign in with Discord
          </FormButton>
        </form>
      )}
    </div>
  );
}
