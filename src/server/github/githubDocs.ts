import type * as PageTree from "fumadocs-core/page-tree";
import { env } from "~/env";

const BASE = "https://api.github.com";

function githubHeaders() {
  return {
    Authorization: `Bearer ${env.GITHUB_TOKEN}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

// ── Types ──────────────────────────────────────────────────────────────────────

export interface TreeEntry {
  /** Relative path within docs/, e.g. "getting-started/installation.md" */
  path: string;
  type: "blob" | "tree";
  sha: string;
}

export interface BranchInfo {
  name: string;
  isDefault: boolean;
}

// ── Repos ─────────────────────────────────────────────────────────────────────

/**
 * Returns all repos in the org that contain a top-level `docs/` directory.
 */
export async function listDocsRepos(): Promise<string[]> {
  const repos: string[] = [];
  let page = 1;

  while (true) {
    const res = await fetch(
      `${BASE}/orgs/${env.GITHUB_ORG}/repos?per_page=100&page=${page}`,
      {
        headers: githubHeaders(),
        next: { revalidate: 3600 },
      },
    );
    if (!res.ok) break;

    const batch: { name: string }[] = await res.json();
    if (batch.length === 0) break;

    const checks = await Promise.allSettled(
      batch.map((r) =>
        fetch(`${BASE}/repos/${env.GITHUB_ORG}/${r.name}/contents/docs`, {
          headers: githubHeaders(),
          next: { revalidate: 3600 },
        }).then((r) => ({ name: r.url.split("/")[7]!, ok: r.ok })),
      ),
    );

    for (const [i, result] of checks.entries()) {
      if (result.status === "fulfilled" && result.value.ok) {
        repos.push(batch[i]!.name);
      }
    }

    if (batch.length < 100) break;
    page++;
  }

  return repos;
}

// ── Branches ──────────────────────────────────────────────────────────────────

export async function listBranches(repo: string): Promise<BranchInfo[]> {
  const [branchesRes, repoRes] = await Promise.all([
    fetch(`${BASE}/repos/${env.GITHUB_ORG}/${repo}/branches?per_page=100`, {
      headers: githubHeaders(),
      next: { revalidate: 300 },
    }),
    fetch(`${BASE}/repos/${env.GITHUB_ORG}/${repo}`, {
      headers: githubHeaders(),
      next: { revalidate: 300 },
    }),
  ]);

  if (!branchesRes.ok || !repoRes.ok) return [];

  const branches: { name: string }[] = await branchesRes.json();
  const { default_branch }: { default_branch: string } = await repoRes.json();

  return branches.map((b) => ({
    name: b.name,
    isDefault: b.name === default_branch,
  }));
}

// ── File tree ─────────────────────────────────────────────────────────────────

/**
 * Returns all `.md` / `.mdx` files under `docs/` for the given repo+branch.
 * Paths are relative to `docs/` (the prefix is stripped).
 */
export async function getDocsTree(
  repo: string,
  branch: string,
): Promise<TreeEntry[]> {
  const res = await fetch(
    `${BASE}/repos/${env.GITHUB_ORG}/${repo}/git/trees/${branch}?recursive=1`,
    {
      headers: githubHeaders(),
      next: { revalidate: env.DOCS_CACHE_TTL },
    },
  );
  if (!res.ok) return [];

  const data: { tree: { path: string; type: string; sha: string }[] } =
    await res.json();

  return data.tree
    .filter(
      (entry) =>
        entry.path.startsWith("docs/") &&
        entry.type === "blob" &&
        /\.(md|mdx)$/.test(entry.path),
    )
    .map((entry) => ({
      path: entry.path.slice("docs/".length),
      type: "blob",
      sha: entry.sha,
    }));
}

// ── File content ──────────────────────────────────────────────────────────────

/**
 * Fetches a single doc file. Tries `.md`, then `.mdx`, then `/index.md`.
 * Returns `null` when not found.
 */
export async function getDocFile(
  repo: string,
  branch: string,
  slugPath: string,
): Promise<string | null> {
  const candidates = [
    `docs/${slugPath}.md`,
    `docs/${slugPath}.mdx`,
    `docs/${slugPath}/index.md`,
  ];

  for (const filePath of candidates) {
    const res = await fetch(
      `${BASE}/repos/${env.GITHUB_ORG}/${repo}/contents/${filePath}?ref=${branch}`,
      {
        headers: githubHeaders(),
        next: { revalidate: env.DOCS_CACHE_TTL },
      },
    );
    if (!res.ok) continue;

    const data: { content: string } = await res.json();
    return Buffer.from(data.content, "base64").toString("utf-8");
  }

  return null;
}

// ── Page tree builder ─────────────────────────────────────────────────────────

function toTitleCase(name: string): string {
  return name
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function stripExt(filePath: string): string {
  return filePath.replace(/\.(md|mdx)$/, "");
}

/**
 * Builds a Fumadocs `PageTree.Root` from the flat `TreeEntry[]` returned by
 * `getDocsTree`. Directories become folders; files become items.
 */
export function buildPageTree(
  repo: string,
  branch: string,
  entries: TreeEntry[],
): PageTree.Root {
  const baseUrl = `/docs/${repo}/${branch}`;

  // Sort: folders before files at each level, then alphabetically
  const sorted = [...entries].sort((a, b) => {
    const aDepth = a.path.split("/").length;
    const bDepth = b.path.split("/").length;
    if (aDepth !== bDepth) return aDepth - bDepth;
    return a.path.localeCompare(b.path);
  });

  const root: PageTree.Root = { name: repo, children: [] };

  // Map of folder path → folder node
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

    // Attach to parent
    const parentPath = folderPath.split("/").slice(0, -1).join("/");
    if (parentPath) {
      getOrCreateFolder(parentPath).children.push(folder);
    } else {
      root.children.push(folder);
    }

    return folder;
  }

  for (const entry of sorted) {
    const stripped = stripExt(entry.path);
    const parts = stripped.split("/");
    const fileName = parts.at(-1)!;
    const folderPath = parts.slice(0, -1).join("/");

    const isIndex =
      fileName === "index" || fileName.toLowerCase() === "readme";

    const url = `${baseUrl}/${isIndex ? parts.slice(0, -1).join("/") : stripped}`.replace(
      /\/$/,
      "",
    );

    const item: PageTree.Item = {
      type: "page",
      name: toTitleCase(isIndex ? (parts.at(-2) ?? fileName) : fileName),
      url,
    };

    if (folderPath) {
      const folder = getOrCreateFolder(folderPath);
      if (isIndex) {
        // Promote to folder index
        folder.index = item;
      } else {
        folder.children.push(item);
      }
    } else {
      if (isIndex) {
        // Root-level index: unshift so it appears first in the sidebar
        root.children.unshift(item);
      } else {
        root.children.push(item);
      }
    }
  }

  return root;
}
