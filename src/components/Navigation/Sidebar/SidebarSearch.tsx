"use client";

import { MagnifyingGlassIcon } from "@phosphor-icons/react/ssr";
import { useSidebar } from ".";

export function CollapsedSearchTrigger() {
  const { setSearchOpen } = useSidebar();
  return (
    <button
      type="button"
      aria-label="Search"
      onClick={() => setSearchOpen(true)}
      className="flex w-full items-center rounded-sm px-2.25 py-2 text-sm text-mauve-400 transition-colors hover:bg-mauve-800 hover:text-white"
    >
      <span className="flex aspect-square h-lh shrink-0 items-center justify-center">
        <MagnifyingGlassIcon className="size-4" />
      </span>
    </button>
  );
}

export function SearchMobileTrigger() {
  const { setSearchOpen } = useSidebar();
  return (
    <button
      type="button"
      aria-label="Search"
      onClick={() => setSearchOpen(true)}
      className="flex items-center justify-center rounded-full bg-mauve-800 p-3 text-white shadow-lg"
    >
      <MagnifyingGlassIcon className="size-5" />
    </button>
  );
}
