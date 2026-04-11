"use client";

import { useEffect, useState } from "react";
import { DocsLayout } from "fumadocs-ui/layouts/docs";
import type * as PageTree from "fumadocs-core/page-tree";
import { LocalPreviewProvider } from "~/components/docs/LocalPreviewContext";

const PREVIEW_URL = "http://localhost:4987";

function toTitleCase(name: string): string {
  return name
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function buildLocalPageTree(paths: string[]): PageTree.Root {
  const root: PageTree.Root = { name: "Local Preview", children: [] };
  const folders = new Map<string, PageTree.Folder>();

  function getOrCreateFolder(folderPath: string): PageTree.Folder {
    if (folders.has(folderPath)) return folders.get(folderPath)!;
    const name = folderPath.split("/").at(-1) ?? folderPath;
    const folder: PageTree.Folder = {
      type: "folder",
      name: toTitleCase(name),
      children: [],
    };
    folders.set(folderPath, folder);
    const parentPath = folderPath.split("/").slice(0, -1).join("/");
    if (parentPath) getOrCreateFolder(parentPath).children.push(folder);
    else root.children.push(folder);
    return folder;
  }

  const sorted = [...paths].sort((a, b) => a.localeCompare(b));

  for (const filePath of sorted) {
    const stripped = filePath.replace(/\.(md|mdx)$/, "");
    const parts = stripped.split("/");
    const fileName = parts.at(-1)!;
    const folderPath = parts.slice(0, -1).join("/");
    const isIndex =
      fileName === "index" || fileName.toLowerCase() === "readme";

    const urlSlug = isIndex ? parts.slice(0, -1).join("/") : stripped;
    const url = `/docs/local${urlSlug ? `/${urlSlug}` : ""}`;

    const item: PageTree.Item = {
      type: "page",
      name: toTitleCase(isIndex ? (parts.at(-2) ?? fileName) : fileName),
      url,
    };

    if (folderPath) {
      const folder = getOrCreateFolder(folderPath);
      if (isIndex) folder.index = item;
      else folder.children.push(item);
    } else {
      if (isIndex) root.children.unshift(item);
      else root.children.push(item);
    }
  }

  return root;
}

function NotRunning() {
  return (
    <div className="flex min-h-screen items-center justify-center p-8">
      <div className="max-w-md text-center">
        <h1 className="mb-3 text-2xl font-bold">Local preview not running</h1>
        <p className="mb-4 text-fd-muted-foreground">
          Start the docs preview server in your project directory:
        </p>
        <pre className="rounded-md bg-fd-muted p-3 text-left text-sm">
          pnpm docs:preview
        </pre>
        <p className="mt-4 text-sm text-fd-muted-foreground">
          Then refresh this page.
        </p>
      </div>
    </div>
  );
}

export default function LocalPreviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [tree, setTree] = useState<PageTree.Root | null>(null);
  const [serverError, setServerError] = useState(false);

  useEffect(() => {
    fetch(`${PREVIEW_URL}/tree`)
      .then((r) => r.json())
      .then((paths: string[]) => setTree(buildLocalPageTree(paths)))
      .catch(() => setServerError(true));
  }, []);

  if (serverError) return <NotRunning />;

  if (!tree) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="animate-pulse text-fd-muted-foreground">
          Connecting to docs preview server…
        </p>
      </div>
    );
  }

  return (
    <LocalPreviewProvider>
      <DocsLayout tree={tree} nav={{ title: "Local Preview" }}>
        {children}
      </DocsLayout>
    </LocalPreviewProvider>
  );
}
