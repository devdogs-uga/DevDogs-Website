"use client";

import type { EdgeConfigSchema } from "~/server/edgeConfig";
import CategoryRow from "./CategoryRow";
import NavItemRow from "./NavItemRow";
import { isCategory, navGroups } from "./sidebar-nav";

export default function SidebarNavGroups({
  collapsed,
  hiddenNavHrefs,
  repos,
  loadingCategory,
  onOpenCategory,
}: {
  collapsed: boolean;
  hiddenNavHrefs: string[];
  repos: EdgeConfigSchema<"docs">;
  loadingCategory: string | null;
  onOpenCategory: (id: string) => void;
}) {
  return (
    <ul className="flex flex-col">
      {navGroups.flatMap((group, gi) => [
        ...(gi > 0
          ? [
              <li
                key={`divider-${gi}`}
                className="relative mt-1 overflow-hidden"
              >
                <hr
                  className={[
                    "absolute inset-x-0 h-0.5 border-mauve-800 transition-[top,translate] duration-200",
                    collapsed
                      ? "top-1/2 -translate-y-1/2"
                      : "top-0 translate-y-0",
                  ].join(" ")}
                />
                {group.heading && (
                  <div
                    className={[
                      "px-1 pt-2.5 pb-1.5 text-[0.7rem] leading-4 font-extrabold tracking-wide whitespace-nowrap text-mauve-600 uppercase transition-opacity duration-200",
                      collapsed ? "opacity-0" : "opacity-100",
                    ].join(" ")}
                  >
                    {group.heading}
                  </div>
                )}
              </li>,
            ]
          : []),
        ...group.items
          .filter(
            (entry) =>
              isCategory(entry) || !hiddenNavHrefs.includes(entry.href),
          )
          .map((entry) =>
            isCategory(entry) ? (
              <li key={entry.id} className="contents">
                <CategoryRow
                  category={entry}
                  collapsed={collapsed}
                  onOpen={onOpenCategory}
                  repos={repos}
                  loading={loadingCategory === entry.id}
                />
              </li>
            ) : (
              <li key={entry.href} className="contents">
                <NavItemRow item={entry} collapsed={collapsed} />
              </li>
            ),
          ),
      ])}
    </ul>
  );
}
