"use client";

import { useEffect, useState } from "react";
import type * as PageTree from "fumadocs-core/page-tree";
import { fetchTree } from "@devdogsuga/docs-preview/client";
import DocTreeRenderer from "./DocTreeRenderer";

export default function SidebarLocalDocsSection() {
  const [tree, setTree] = useState<PageTree.Node[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchTree()
      .then(setTree)
      .catch(() => setError(true));
  }, []);

  if (error) {
    return (
      <div className="flex flex-col gap-2 px-2 py-3">
        <p className="text-sm text-mauve-500">Preview server not running.</p>
        <pre className="rounded-sm bg-mauve-800 px-2 py-1.5 text-xs whitespace-pre-wrap text-mauve-300">
          pnpm dlx @devdogsuga/docs-preview
        </pre>
      </div>
    );
  }

  if (!tree) {
    return (
      <p className="animate-pulse px-2 py-3 text-sm text-mauve-500">
        Connecting…
      </p>
    );
  }

  return <DocTreeRenderer nodes={tree} />;
}
