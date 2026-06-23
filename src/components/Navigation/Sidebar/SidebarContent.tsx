"use client";

import { useMemo, type ComponentProps } from "react";
import { MagnifyingGlassIcon } from "@phosphor-icons/react/ssr";
import * as Tooltip from "@radix-ui/react-tooltip";
import SidebarFooter from "./SidebarFooter";
import SidebarHeader from "./SidebarHeader";
import SidebarItems from "./SidebarItems";
import { useSidebar } from ".";

interface Props {
  user?: ComponentProps<typeof SidebarFooter>["user"];
  docs?: [];
}

export default function SidebarContent({ user, docs }: Props) {
  const { setSearchOpen } = useSidebar();
  const ctrl = useMemo(
    () =>
      typeof navigator !== "undefined" &&
      /Mac|iPhone|iPad|iPod/.test(navigator.userAgent)
        ? "⌘"
        : "Ctrl",
    [],
  );

  return (
    <div className="flex h-full w-full flex-col gap-3 border-r-2 border-mauve-800 bg-mauve-950 p-3 max-lg:group-data-expanded:shadow-2xl">
      <SidebarHeader />

      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <button
            type="button"
            aria-label="Search"
            onClick={() => setSearchOpen(true)}
            className="group/search flex w-full items-center gap-2 overflow-hidden rounded-md border border-mauve-700 px-2 py-2 text-sm text-mauve-400 transition-colors not-group-data-expanded/sidebar:border-transparent group-data-expanded/sidebar:bg-mauve-900 hover:bg-mauve-800 hover:text-white"
          >
            <span className="flex aspect-square h-lh shrink-0 items-center justify-center">
              <MagnifyingGlassIcon className="size-4" />
            </span>
            <span className="flex-1 text-left not-group-data-expanded/sidebar:w-0">
              Search
            </span>
            <span className="-mt-px hidden gap-0.5 text-xs text-mauve-400 *:rounded-sm *:border *:border-b-2 *:border-mauve-700 *:bg-mauve-900 *:px-1 *:shadow-xs sm:flex">
              <kbd suppressHydrationWarning>{ctrl}</kbd>
              <kbd>K</kbd>
            </span>
          </button>
        </Tooltip.Trigger>

        <Tooltip.Content
          className="z-20 hidden items-center gap-2.5 rounded-md border border-mauve-700 bg-mauve-800 px-2.5 py-1.5 text-sm/none text-mauve-100 shadow-md select-none not-group-data-expanded/sidebar:flex"
          side="right"
          sideOffset={6}
        >
          Search
          <span className="-mb-px hidden gap-0.5 text-xs text-mauve-400 *:rounded-sm *:border *:border-b-2 *:border-mauve-700 *:bg-mauve-900 *:px-1 *:shadow-xs sm:flex">
            <kbd suppressHydrationWarning>{ctrl}</kbd>
            <kbd>K</kbd>
          </span>
        </Tooltip.Content>
      </Tooltip.Root>

      <div className="relative -mx-3 flex-1">
        <ul className="sidebar-scroll-shadow absolute h-full w-full overflow-y-auto px-3">
          <SidebarItems />
        </ul>
      </div>

      <SidebarFooter fallback={docs ? "cta" : "skeleton"} user={user} />
    </div>
  );
}
