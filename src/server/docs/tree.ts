import type { GitTreeEntry } from "./github";
import { fetchFileContent } from "./github";
import { stripExt } from "./utils";

// ── Types ────────────────────────────────────────────────────────────────────

export interface MetaJson {
  title?: string;
  pages?: (string | { name: string; label: string })[];
}

export interface TreeEntry {
  path: string;
  type: "blob" | "tree";
  sha: string;
  label?: string;
}

export interface DocTree {
  entries: TreeEntry[];
  metaByFolder: Map<string, MetaJson>;
}

// ── Tree building ────────────────────────────────────────────────────────────

export async function buildDocTree(
  repo: string,
  branch: string,
  gitTree: GitTreeEntry[],
): Promise<DocTree> {
  const rawEntries: TreeEntry[] = gitTree
    .filter(
      (e) =>
        e.path.startsWith("docs/") &&
        e.type === "blob" &&
        /\.(md|mdx)$/.test(e.path),
    )
    .map((e) => ({
      path: e.path.slice("docs/".length),
      type: "blob" as const,
      sha: e.sha,
    }));

  const metaJsonPaths = gitTree
    .filter(
      (e) =>
        e.type === "blob" && /^docs(\/[^/]+)?\/meta\.json$/.test(e.path),
    )
    .map((e) => e.path);

  const metaByFolder = new Map<string, MetaJson>();

  await Promise.all(
    metaJsonPaths.map(async (metaPath) => {
      const content = await fetchFileContent(repo, branch, metaPath);
      if (!content) return;
      try {
        const folderPath =
          metaPath === "docs/meta.json"
            ? ""
            : metaPath.slice("docs/".length, -"/meta.json".length);
        const meta = JSON.parse(content) as MetaJson;
        metaByFolder.set(folderPath, meta);
      } catch {
        // ignore malformed meta.json
      }
    }),
  );

  const entries = applyMetaToEntries(rawEntries, metaByFolder);
  return { entries, metaByFolder };
}

// ── Meta ordering ────────────────────────────────────────────────────────────

function applyMetaToEntries(
  entries: TreeEntry[],
  metaByFolder: Map<string, MetaJson>,
): TreeEntry[] {
  const byFolder = new Map<string, TreeEntry[]>();
  for (const entry of entries) {
    const parts = stripExt(entry.path).split("/");
    const folder = parts.length > 1 ? parts.slice(0, -1).join("/") : "";
    if (!byFolder.has(folder)) byFolder.set(folder, []);
    byFolder.get(folder)!.push(entry);
  }

  function directChildFolders(parentPath: string): string[] {
    const parentDepth = parentPath ? parentPath.split("/").length : 0;
    const kids = new Set<string>();
    for (const entry of entries) {
      const parts = stripExt(entry.path).split("/");
      if (parts.length <= parentDepth + 1) continue;
      const ancestor = parts.slice(0, parentDepth + 1).join("/");
      if (parentPath && !ancestor.startsWith(parentPath + "/")) continue;
      if (!parentPath && ancestor.includes("/")) continue;
      kids.add(parts.slice(0, parentDepth + 1).join("/"));
    }
    return [...kids].sort((a, b) => a.localeCompare(b));
  }

  const result: TreeEntry[] = [];
  const visitedFolders = new Set<string>();

  function visitFolder(folderPath: string) {
    if (visitedFolders.has(folderPath)) return;
    visitedFolders.add(folderPath);

    const folderEntries = byFolder.get(folderPath) ?? [];
    const meta = metaByFolder.get(folderPath);

    let orderedEntries: TreeEntry[];
    if (meta?.pages) {
      const nameToEntry = new Map(
        folderEntries.map((e) => [stripExt(e.path.split("/").at(-1)!), e]),
      );
      orderedEntries = [];
      const seen = new Set<string>();

      for (const page of meta.pages) {
        if (page === "...rest") {
          const rest = folderEntries
            .filter((e) => !seen.has(stripExt(e.path.split("/").at(-1)!)))
            .sort((a, b) => a.path.localeCompare(b.path));
          orderedEntries.push(...rest);
        } else {
          const name = typeof page === "string" ? page : page.name;
          const label = typeof page === "object" ? page.label : undefined;
          const entry = nameToEntry.get(name);
          if (entry && !seen.has(name)) {
            orderedEntries.push(label ? { ...entry, label } : entry);
            seen.add(name);
          }
        }
      }
    } else {
      orderedEntries = [...folderEntries].sort((a, b) =>
        a.path.localeCompare(b.path),
      );
    }

    result.push(...orderedEntries);

    const allChildFolders = directChildFolders(folderPath);
    const metaNames = meta?.pages?.map((p) =>
      typeof p === "string" ? p : p.name,
    );
    const hasRest = meta?.pages?.includes("...rest") ?? false;

    const sortedChildren = metaNames
      ? [
          ...allChildFolders
            .filter((f) => metaNames.includes(f.split("/").at(-1)!))
            .sort((a, b) => {
              const ai = metaNames.indexOf(a.split("/").at(-1)!);
              const bi = metaNames.indexOf(b.split("/").at(-1)!);
              return ai - bi;
            }),
          ...(hasRest
            ? allChildFolders
                .filter((f) => !metaNames.includes(f.split("/").at(-1)!))
                .sort((a, b) => a.localeCompare(b))
            : []),
        ]
      : allChildFolders;

    sortedChildren.forEach(visitFolder);
  }

  visitFolder("");
  return result;
}
