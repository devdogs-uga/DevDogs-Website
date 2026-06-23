/** Raw GitHub API calls for documentation content. No caching — that's the manifest layer's job. */

import { env } from "~/env";

const BASE = "https://api.github.com";

function githubHeaders() {
  return {
    Authorization: `Bearer ${env.GITHUB_TOKEN}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

// ── Types ────────────────────────────────────────────────────────────────────

export interface BranchInfo {
  name: string;
  isDefault: boolean;
}

export interface GitTreeEntry {
  path: string;
  type: string;
  sha: string;
}

// ── Branches ─────────────────────────────────────────────────────────────────

export async function fetchBranches(repo: string): Promise<BranchInfo[]> {
  const [branchesRes, repoRes] = await Promise.all([
    fetch(`${BASE}/repos/${env.GITHUB_ORG}/${repo}/branches?per_page=100`, {
      headers: githubHeaders(),
    }),
    fetch(`${BASE}/repos/${env.GITHUB_ORG}/${repo}`, {
      headers: githubHeaders(),
    }),
  ]);

  if (!branchesRes.ok || !repoRes.ok) return [];

  const branches = (await branchesRes.json()) as { name: string }[];
  const { default_branch } = (await repoRes.json()) as {
    default_branch: string;
  };

  return branches.map((b) => ({
    name: b.name,
    isDefault: b.name === default_branch,
  }));
}

// ── Git tree ─────────────────────────────────────────────────────────────────

export async function fetchGitTree(
  repo: string,
  branch: string,
): Promise<GitTreeEntry[]> {
  const res = await fetch(
    `${BASE}/repos/${env.GITHUB_ORG}/${repo}/git/trees/${branch}?recursive=1`,
    { headers: githubHeaders() },
  );
  if (!res.ok) return [];

  const data = (await res.json()) as {
    tree: GitTreeEntry[];
  };
  return data.tree;
}

// ── File content ─────────────────────────────────────────────────────────────

export async function fetchFileContent(
  repo: string,
  branch: string,
  filePath: string,
): Promise<string | null> {
  const res = await fetch(
    `${BASE}/repos/${env.GITHUB_ORG}/${repo}/contents/${filePath}?ref=${branch}`,
    { headers: githubHeaders() },
  );
  if (!res.ok) return null;
  const data = (await res.json()) as { content: string };
  return Buffer.from(data.content, "base64").toString("utf-8");
}

export async function fetchDocFile(
  repo: string,
  branch: string,
  slug: string,
): Promise<string | null> {
  const candidates = [
    `docs/${slug}.md`,
    `docs/${slug}.mdx`,
    `docs/${slug}/index.md`,
  ];

  for (const filePath of candidates) {
    const content = await fetchFileContent(repo, branch, filePath);
    if (content !== null) return content;
  }

  return null;
}
