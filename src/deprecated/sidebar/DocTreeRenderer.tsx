"use client";

import { usePathname } from "next/navigation";
import type * as PageTree from "fumadocs-core/page-tree";
import {
  SidebarFolder,
  SidebarFolderContent,
  SidebarFolderLink,
  SidebarFolderTrigger,
  SidebarItem,
  SidebarProvider,
} from "fumadocs-ui/components/sidebar/base";

const itemClass =
  "flex h-8 items-center rounded-sm px-2 text-sm text-mauve-400 transition-colors hover:bg-mauve-800 hover:text-white data-[active=true]:bg-mauve-800 data-[active=true]:text-white";

function isActive(node: PageTree.Node, pathname: string): boolean {
  if (node.type === "page") {
    return pathname === node.url || pathname.startsWith(node.url + "/");
  }
  if (node.type === "folder") {
    if (
      node.index &&
      (pathname === node.index.url ||
        pathname.startsWith(node.index.url + "/"))
    )
      return true;
    return node.children.some((c) => isActive(c, pathname));
  }
  return false;
}

function TreeNode({
  node,
  pathname,
}: {
  node: PageTree.Node;
  pathname: string;
}) {
  if (node.type === "separator") return null;

  if (node.type === "page") {
    const selfActive =
      pathname === node.url || pathname.startsWith(node.url + "/");
    return (
      <SidebarItem href={node.url} active={selfActive} className={itemClass}>
        {node.name}
      </SidebarItem>
    );
  }

  const indexUrl = node.index?.url;
  const selfActive = indexUrl
    ? pathname === indexUrl || pathname.startsWith(indexUrl + "/")
    : false;
  const childActive = node.children.some((c) => isActive(c, pathname));

  return (
    <SidebarFolder
      defaultOpen={selfActive || childActive}
      active={selfActive || childActive}
    >
      {indexUrl ? (
        <SidebarFolderLink
          href={indexUrl}
          active={selfActive}
          className={itemClass}
        >
          {node.name}
        </SidebarFolderLink>
      ) : (
        <SidebarFolderTrigger className={itemClass}>
          {node.name}
        </SidebarFolderTrigger>
      )}
      <SidebarFolderContent className="ms-2 border-s border-mauve-800 ps-2">
        {node.children.map((child, i) => (
          <TreeNode
            key={child.$id ?? `child-${i}`}
            node={child}
            pathname={pathname}
          />
        ))}
      </SidebarFolderContent>
    </SidebarFolder>
  );
}

export default function DocTreeRenderer({
  nodes,
}: {
  nodes: PageTree.Node[];
}) {
  const pathname = usePathname();

  if (nodes.length === 0) {
    return <p className="px-2 py-3 text-sm text-mauve-500">No pages found.</p>;
  }

  return (
    <SidebarProvider>
      <div className="flex flex-col py-1">
        {nodes.map((node, i) => (
          <TreeNode
            key={node.$id ?? `node-${i}`}
            node={node}
            pathname={pathname}
          />
        ))}
      </div>
    </SidebarProvider>
  );
}
