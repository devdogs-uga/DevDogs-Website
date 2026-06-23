"use client";

import * as Dropdown from "@radix-ui/react-dropdown-menu";
import { motion } from "motion/react";
import Link from "next/link";
import { useState } from "react";
import {
  SealCheckIcon,
  WarningCircleIcon,
  DotsThreeIcon,
  SignOutIcon,
  ChatCircleDotsIcon,
  UserIcon,
} from "@phosphor-icons/react/ssr";
import Avatar from "~/components/AvatarField/Avatar";
import FeedbackDialog from "~/components/FeedbackDialog";
import { useVerification } from "~/components/Navigation/VerificationProvider";
import signOut from "~/server/actions/signOut";
import type { profiles } from "~/server/db/schema";
import VerificationAlert from "./VerificationAlert";

interface Props {
  user: {
    profile: typeof profiles.$inferSelect;
    userRoles: { role: { title: string } }[];
  };
}

export default function ProfileMenu({ user }: Props) {
  const verification = useVerification();
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  return (
    <>
      <Dropdown.Root>
        <Dropdown.Trigger asChild>
          <motion.button
            className="group/trigger flex w-full items-center overflow-hidden shadow-md group-data-collapsed/sidebar:my-1 group-data-collapsed/sidebar:w-9"
            type="button"
            aria-label="Open profile menu"
          >
            <span className="relative shrink-0 text-4xl/0">
              <Avatar
                userId={user.profile.userId}
                preferredName={user.profile.preferredName}
              />
              {verification?.isVerified === false && (
                <span className="absolute -right-0.5 -bottom-0.5 flex size-3 items-center justify-center rounded-full bg-mauve-950">
                  <WarningCircleIcon className="size-2.5 text-amber-400" />
                </span>
              )}
            </span>
            <span className="flex flex-1 flex-col truncate px-2 text-left">
              <span className="text-sm/none text-white">
                {user.profile.preferredName}
              </span>
              <span className="flex items-center gap-1 text-xs/none text-mauve-400">
                {user.userRoles[0]?.role.title ?? "Member"}
                {verification?.isVerified && (
                  <SealCheckIcon className="size-3 text-emerald-400" />
                )}
              </span>
            </span>
            <span className="rounded-full border border-current p-1 text-center text-sm text-mauve-400 transition-colors group-hover/trigger:bg-mauve-800 group-hover/trigger:text-white">
              <DotsThreeIcon />
            </span>
          </motion.button>
        </Dropdown.Trigger>

        <Dropdown.Portal>
          <Dropdown.Content
            side="top"
            align="start"
            sideOffset={8}
            className="z-100 w-3xs max-w-(--radix-popper-available-width) min-w-(--radix-popper-anchor-width) rounded-md border-2 bg-black/80 py-1.5 text-sm font-medium text-white backdrop-blur-xs"
          >
            {verification && !verification.isVerified && (
              <Dropdown.Item asChild>
                <div className="px-1.5 pb-1.5 focus:outline-none">
                  <VerificationAlert />
                </div>
              </Dropdown.Item>
            )}

            <Dropdown.Item asChild>
              <Link
                href="/account"
                className="flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left transition-colors hover:bg-mauve-800 focus:outline-none"
              >
                Account
                <UserIcon />
              </Link>
            </Dropdown.Item>

            <Dropdown.Item asChild>
              <button
                type="button"
                className="flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left transition-colors hover:bg-mauve-800 focus:outline-none"
                onClick={() => setFeedbackOpen(true)}
              >
                Send Feedback
                <ChatCircleDotsIcon />
              </button>
            </Dropdown.Item>

            <div className="mx-1.5 my-1.5 h-px w-[calc(100%-var(--spacing)*3)] bg-mauve-700" />

            <form action={signOut}>
              <input name="callbackPath" value="/" type="hidden" />
              <Dropdown.Item asChild>
                <button
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-rose-300 transition-colors hover:bg-rose-950 hover:text-rose-50"
                  type="submit"
                >
                  <SignOutIcon /> Sign Out
                </button>
              </Dropdown.Item>
            </form>
          </Dropdown.Content>
        </Dropdown.Portal>
      </Dropdown.Root>

      <FeedbackDialog open={feedbackOpen} onOpenChange={setFeedbackOpen} />
    </>
  );
}
