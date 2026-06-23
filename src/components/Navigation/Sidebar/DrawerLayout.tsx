"use client";

import { motion, useDragControls, type PanInfo } from "motion/react";
import { useCallback, type PropsWithChildren } from "react";
import { MagnifyingGlassIcon } from "@phosphor-icons/react/ssr";
import { useSidebar } from ".";

export default function MobileDrawer({ children }: PropsWithChildren) {
  const { setExpanded, setSearchOpen } = useSidebar();
  const dragControls = useDragControls();

  const openSearch = useCallback(() => {
    setSearchOpen(true);
  }, [setSearchOpen]);

  const openNavigation = useCallback(() => {
    setExpanded(true);
  }, [setSearchOpen]);

  const handleDragEnd = useCallback(
    (_: DragEvent, info: PanInfo) => {
      if (info.offset.y > 120 || info.velocity.y > 500) {
        setExpanded(false);
      }
    },
    [setExpanded],
  );

  return (
    <>
      <div className="fixed right-4 bottom-4 z-49 flex items-center rounded-lg border border-mauve-700 bg-mauve-950 shadow-lg sm:hidden">
        <button
          type="button"
          onClick={openSearch}
          aria-label="Search"
          className="flex items-center justify-center px-3 py-2.5 text-mauve-300 transition-colors hover:text-white"
        >
          <MagnifyingGlassIcon className="size-5" />
        </button>
        <div className="h-5 w-px bg-mauve-700" />
        <button
          type="button"
          onClick={openNavigation}
          aria-label="Open menu"
          className="flex items-center justify-center px-3 py-2.5 text-mauve-300 transition-colors hover:text-white"
        >
          <span className="flex w-5 flex-col items-end justify-center gap-1.5">
            <span className="block h-0.5 w-full bg-current" />
            <span className="block h-0.5 w-3 bg-current" />
          </span>
        </button>
      </div>
      <motion.div
        drag="y"
        dragControls={dragControls}
        dragListener={false}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.6 }}
        onDragEnd={handleDragEnd}
        className="fixed inset-x-0 z-50 flex h-[85dvh] group-data-expanded/sidebar:top-[15dvh] top-full transition-[top] flex-col overflow-hidden rounded-t-2xl border-t border-mauve-800 bg-mauve-950 sm:static sm:contents"
      >
        <div
          onPointerDown={(e) => dragControls.start(e)}
          className="flex shrink-0 touch-none justify-center pt-2 pb-5 -mb-3 sm:hidden"
        >
          <div className="h-1 w-10 rounded-full bg-mauve-700" />
        </div>
        <div className="min-h-0 flex-1 sm:contents">{children}</div>
      </motion.div>
    </>
  );
}
