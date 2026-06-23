"use client";

import * as Popover from "@radix-ui/react-popover";
import * as Tooltip from "@radix-ui/react-tooltip";
import { AnimatePresence, motion } from "motion/react";
import { usePathname } from "next/navigation";
import { LuChevronRight, LuLoaderCircle } from "react-icons/lu";
import type { EdgeConfigSchema } from "~/server/edgeConfig";
import CategoryFlyoutItem from "./CategoryFlyoutItem";
import { isCategoryActive, type NavCategory } from "./sidebar-nav";
import SidebarDocsSection from "./SidebarDocsSection";
import SidebarLocalDocsSection from "./SidebarLocalDocsSection";

const labelMotion = {
  initial: { opacity: 0, width: 0 },
  animate: { opacity: 1, width: "auto" },
  exit: { opacity: 0, width: 0 },
  transition: { duration: 0.18 },
};

export default function CategoryRow({
  category,
  collapsed,
  onOpen,
  repos,
  loading,
}: {
  category: NavCategory;
  collapsed: boolean;
  onOpen: (id: string) => void;
  repos: EdgeConfigSchema<"docs">;
  loading?: boolean;
}) {
  const pathname = usePathname();
  const active = isCategoryActive(category, pathname);

  if (collapsed) {
    return (
      <Popover.Root>
        <Tooltip.Root>
          <Tooltip.Trigger asChild>
            <Popover.Trigger asChild>
              <button
                type="button"
                data-active={active || undefined}
                className="flex w-full items-center rounded-sm px-2.25 py-1.5 text-sm text-mauve-400 transition-colors hover:bg-mauve-800 hover:text-white data-active:bg-mauve-800 data-active:text-white"
              >
                <span className="flex aspect-square h-lh shrink-0 items-center justify-center">
                  <category.icon />
                </span>
              </button>
            </Popover.Trigger>
          </Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Content
              side="right"
              sideOffset={8}
              className="z-100 rounded-sm border border-mauve-700 bg-mauve-900 px-2 py-1 text-sm font-medium text-white"
            >
              {category.title}
            </Tooltip.Content>
          </Tooltip.Portal>
        </Tooltip.Root>

        <Popover.Portal>
          <Popover.Content
            side="right"
            sideOffset={8}
            align="start"
            className="shadow-block-md z-100 w-52 rounded-sm border border-mauve-700 bg-mauve-950 py-2"
          >
            <div className="px-3 pb-1.5 text-xs font-semibold tracking-wider text-mauve-500 uppercase">
              {category.title}
            </div>
            {category.isDocsCategory ? (
              <SidebarDocsSection repos={repos} />
            ) : category.isLocalPreviewCategory ? (
              <SidebarLocalDocsSection />
            ) : (
              category.items.map((item) => (
                <CategoryFlyoutItem
                  key={item.href}
                  item={item}
                  pathname={pathname}
                />
              ))
            )}
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    );
  }

  return (
    <button
      type="button"
      data-active={active || undefined}
      disabled={loading}
      className="group flex w-full items-center overflow-hidden rounded-sm px-2.25 py-1.5 text-sm text-mauve-400 transition-colors hover:bg-mauve-800 hover:text-white disabled:cursor-default disabled:opacity-70 disabled:hover:bg-transparent disabled:hover:text-mauve-400 data-active:bg-mauve-800 data-active:text-white"
      onClick={() => onOpen(category.id)}
    >
      <span className="flex aspect-square h-lh shrink-0 items-center justify-center">
        <category.icon />
      </span>
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.span
            key={`cat-${category.id}`}
            {...labelMotion}
            className="flex flex-1 items-center justify-between overflow-hidden px-2.25"
          >
            <span className="whitespace-nowrap">{category.title}</span>
            {loading ? (
              <LuLoaderCircle className="shrink-0 animate-spin text-mauve-600" />
            ) : (
              <LuChevronRight className="shrink-0 text-mauve-600 transition-colors group-hover:text-mauve-400" />
            )}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}
