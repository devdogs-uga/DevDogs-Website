"use client";

import * as Tooltip from "@radix-ui/react-tooltip";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { isItemActive, type NavItem } from "./sidebar-nav";

const labelMotion = {
  initial: { opacity: 0, width: 0 },
  animate: { opacity: 1, width: "auto" },
  exit: { opacity: 0, width: 0 },
  transition: { duration: 0.18 },
};

export default function NavItemRow({
  item,
  collapsed,
}: {
  item: NavItem;
  collapsed: boolean;
}) {
  const pathname = usePathname();
  const active = isItemActive(item.href, pathname);

  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>
        <Link
          href={item.href}
          prefetch
          data-active={active || undefined}
          className="flex items-center overflow-hidden rounded-sm px-2.25 py-1.5 text-sm text-mauve-400 transition-colors hover:bg-mauve-800 hover:text-white data-active:bg-mauve-800 data-active:text-white"
        >
          <span className="flex aspect-square h-lh shrink-0 items-center justify-center">
            <item.icon />
          </span>
          <AnimatePresence initial={false}>
            {!collapsed && (
              <motion.span
                key={item.href}
                {...labelMotion}
                className="overflow-hidden pl-2.25 whitespace-nowrap"
              >
                {item.title}
              </motion.span>
            )}
          </AnimatePresence>
        </Link>
      </Tooltip.Trigger>
      {collapsed && (
        <Tooltip.Portal>
          <Tooltip.Content
            side="right"
            sideOffset={8}
            className="z-100 rounded-sm border border-mauve-700 bg-mauve-900 px-2 py-1 text-sm font-medium text-white"
          >
            {item.title}
          </Tooltip.Content>
        </Tooltip.Portal>
      )}
    </Tooltip.Root>
  );
}
