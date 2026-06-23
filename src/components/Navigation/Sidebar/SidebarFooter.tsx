"use client";

import { useCallback, type ComponentProps } from "react";
import { ArrowLineLeftIcon, ArrowLineRightIcon } from "@phosphor-icons/react/ssr";
import { useSidebar } from ".";
import JoinUsButton from "../JoinUsButton";
import ProfileMenu from "./ProfileMenu";
import { useSidebarWidth } from "./SidebarWidthScript";

interface Props {
  user?: ComponentProps<typeof ProfileMenu>["user"];
  fallback: "skeleton" | "cta";
}

export default function SidebarFooter({ user, fallback }: Props) {
  const { expanded, setExpanded } = useSidebar();

  if (!user && fallback === "cta") {
    return (
      <div className="flex shrink-0 justify-center">
        <JoinUsButton />
      </div>
    );
  }
  const toggleExpanded = useCallback(() => {
    setExpanded((e) => !e);
  }, [setExpanded]);

  return (
    <div className="flex shrink-0 flex-col gap-3 group-data-collapsed/sidebar:items-center">
      <div className="flex items-center gap-2 not-group-data-expanded/sidebar:flex-col">
        {user ? (
          <ProfileMenu user={user} />
        ) : (
          <div className="flex w-full animate-pulse items-center overflow-hidden group-data-collapsed/sidebar:my-1 group-data-collapsed/sidebar:w-9">
            <span className="size-9 shrink-0 rounded-full bg-mauve-800" />
            <span className="flex flex-1 flex-col gap-1.5 truncate px-2">
              <span className="h-3 w-20 rounded bg-mauve-800" />
              <span className="h-2.5 w-14 rounded bg-mauve-800/60" />
            </span>
          </div>
        )}

        <button
          type="button"
          onClick={toggleExpanded}
          aria-label={!expanded ? "Expand sidebar" : "Collapse sidebar"}
          className="relative hidden sm:flex aspect-square size-6 items-center justify-center rounded-full border border-current text-center text-sm text-mauve-400 transition-colors *:-mr-px *:ml-px not-group-data-expanded/sidebar:border-transparent not-group-data-expanded/sidebar:p-4.25 not-group-data-expanded/sidebar:text-lg hover:bg-mauve-800 hover:text-white"
        >
          <ArrowLineRightIcon className="absolute transition-opacity group-data-expanded/sidebar:opacity-0" />
          <ArrowLineLeftIcon className="absolute transition-opacity not-group-data-expanded/sidebar:opacity-0" />
        </button>
      </div>
    </div>
  );
}
