import Link from "next/link";
import Marquee from "react-fast-marquee";
import { SealCheckIcon, SignOutIcon, ConfettiIcon } from "@phosphor-icons/react/ssr";
import Avatar from "~/components/AvatarField/Avatar";
import signOut from "~/server/actions/signOut";
import type { leaderboardProfiles, profiles } from '~/server/db/schema';

export interface ProfileMenuContentProps {
  profile: typeof profiles.$inferSelect;
  githubProfile?: typeof leaderboardProfiles.$inferSelect | null;
  streak?: {
    length: number;
    renewalStart: Date;
    renewalCutoff: Date;
  } | null;
  onSelect?: () => void;
  callbackPath?: string;
  highestRole?: { title: string; color: string | null };
  isVerified?: boolean;
}

export default function ProfileMenuContent({
  profile,
  githubProfile,
  streak,
  onSelect,
  callbackPath = "/",
  highestRole,
  isVerified = false,
}: ProfileMenuContentProps) {
  return (
    <>
      {/* {githubProfile && (
        <>
          <div className="flex flex-col px-3 py-1.5 text-amber-400">
            <span className="text-[0.66rem]/none font-extrabold uppercase opacity-55">
              This Year
            </span>
            <span className="font-bold">
              {githubProfile.currentYearPoints} points{" "}
              <span className="opacity-70">
                (#{githubProfile.currentYearRanking})
              </span>
            </span>
          </div>

          {streak && (
            <div className="relative my-1.5 h-4.5 overflow-hidden border-t border-rose-700 bg-rose-700 py-px text-center text-xs font-extrabold tracking-wide text-rose-100 uppercase italic">
              <div className="absolute inset-0 size-full drop-shadow-[1px_1px_0px_black]">
                <Marquee autoFill>
                  <p className="flex items-center gap-3 pr-3">
                    {streak.length} Week Streak
                    <ConfettiIcon className="text-amber-300" />
                  </p>
                </Marquee>
              </div>
            </div>
          )}

          <div className="flex flex-col px-3 py-1.5">
            <span className="text-[0.66rem]/none font-extrabold text-mauve-500 uppercase">
              All Time
            </span>
            <span className="font-bold">
              {githubProfile.allTimePoints} points{" "}
              <span className="text-mauve-400">
                (#{githubProfile.allTimeRanking})
              </span>
            </span>
          </div>

          <div className="mx-1.5 my-1.5 h-px w-[calc(100%-var(--spacing)*3)] bg-mauve-700" />
        </>
      )} */}

      <form action={signOut}>
        <input name="callbackPath" value={callbackPath} type="hidden" />
        <button
          className="flex w-full items-center gap-2 px-3 py-1.5 text-rose-300 transition-colors hover:bg-rose-950 hover:text-rose-50"
          type="submit"
          onClick={onSelect}
        >
          <SignOutIcon /> Sign Out
        </button>
      </form>
    </>
  );
}
