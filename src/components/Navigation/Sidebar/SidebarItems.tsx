"use client";

import * as Tooltip from "@radix-ui/react-tooltip";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode, useMemo } from "react";
import { appManifest } from "~/server/manifest";
import type { ManifestFolder, ManifestNode, ManifestPage } from "~/server/manifest/types";
import { iconMap } from "~/ui/icon-map";

function SidebarFolder({ folder }: { folder: ManifestFolder }) {
  if (!folder.name) return null;
  return (
    <>
      <hr className="mt-1.5 bg-mauve-800 not-group-data-expanded/sidebar:mt-4.5" />
      <li className="truncate pt-3 pb-1.5 text-xs/none font-bold tracking-wide text-mauve-500 uppercase transition-opacity duration-0 not-group-data-expanded/sidebar:pt-0 not-group-data-expanded/sidebar:opacity-0">
        {folder.name}
      </li>
    </>
  );
}

function SidebarPage({ page }: { page: ManifestPage }) {
  const pathname = usePathname();

  if (page.showInSidebar === false) return null;

  const Icon = iconMap[page.icon];

  return (
    <Tooltip.Root>
      <li className="contents">
        <Tooltip.Trigger asChild>
          <Link
            className="flex items-center overflow-hidden rounded-md py-1.5 text-sm text-mauve-400 transition-colors hover:bg-mauve-800 hover:text-mauve-100 data-active:bg-mauve-700/75 data-active:text-white"
            data-active={pathname === page.url || undefined}
            href={page.url}
          >
            <span className="px-3">
              {Icon ? <Icon className="size-4" /> : null}
            </span>
            <span className="truncate overflow-hidden pr-3">{page.name}</span>
          </Link>
        </Tooltip.Trigger>
        <Tooltip.Content
          className="z-20 rounded-md border select-none border-mauve-700 bg-mauve-800 px-2.5 py-1.5 text-sm/none text-mauve-100 shadow-md not-group-data-expanded/sidebar:block hidden"
          side="right"
          sideOffset={6}
        >
          {page.name}
        </Tooltip.Content>
      </li>
    </Tooltip.Root>
  );
}

function renderNode(node: ManifestNode): ReactNode {
  switch (node.type) {
    case "folder":
      return (
        <SidebarFolder key={node.id} folder={node} />
      );
    case "page":
      return <SidebarPage key={node.id} page={node} />;
  }
}

export default function SidebarItems() {
  return useMemo(
    () =>
      appManifest.children.flatMap((folder) => [
        renderNode(folder),
        ...folder.children.map(renderNode),
      ]),
    [],
  );
}
