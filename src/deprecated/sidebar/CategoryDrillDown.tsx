"use client";

import { LuChevronLeft } from "react-icons/lu";
import type { EdgeConfigSchema } from "~/server/edgeConfig";
import type { NavCategory } from "./sidebar-nav";
import NavItemRow from "./NavItemRow";
import SidebarDocsSection from "./SidebarDocsSection";
import SidebarLocalDocsSection from "./SidebarLocalDocsSection";

export default function CategoryDrillDown({
  category,
  repos,
  onBack,
  onFirstDocsHref,
  onLinkClick,
}: {
  category: NavCategory | undefined;
  repos: EdgeConfigSchema<"docs">;
  onBack: () => void;
  onFirstDocsHref?: (href: string) => void;
  onLinkClick?: (e: React.MouseEvent) => void;
}) {
  return (
    <div onClickCapture={onLinkClick} className="flex flex-col">
      <button
        type="button"
        onClick={onBack}
        className="mb-1 flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-mauve-400 transition-colors hover:bg-mauve-800 hover:text-white"
      >
        <LuChevronLeft className="shrink-0" />
        <span className="font-medium whitespace-nowrap">
          {category?.title ?? "Back"}
        </span>
      </button>
      <hr className="mb-1 border-mauve-800" />

      {category?.isDocsCategory ? (
        <SidebarDocsSection repos={repos} onFirstHref={onFirstDocsHref} />
      ) : category?.isLocalPreviewCategory ? (
        <SidebarLocalDocsSection />
      ) : (
        <ul className="flex flex-col">
          {category?.items.map((item) => (
            <li key={item.href} className="contents">
              <NavItemRow item={item} collapsed={false} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
