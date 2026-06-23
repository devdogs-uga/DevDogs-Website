"use cache";

import { cacheLife, cacheTag } from "next/cache";
import { extractStructure } from "~/lib/extract-structure";
import { fetchBranches, fetchDocFile, fetchGitTree } from "~/server/docs/github";
import type { BranchInfo } from "~/server/docs/github";
import { buildDocTree } from "~/server/docs/tree";
import type { DocTree } from "~/server/docs/tree";
import { stripExt, toTitleCase } from "~/server/docs/utils";
import {
  docsBranchesTag,
  docsFileSearchTag,
  docsSearchIndexTag,
  docsTreeTag,
} from "../cache";
import type { DocHeading, DocPageEntry } from "../types";

// ── Layer 1: Per-file doc entries ────────────────────────────────────────────

export async function getDocFileEntries(
  repo: string,
  branch: string,
  slug: string,
): Promise<DocPageEntry> {
  cacheTag(docsFileSearchTag({ repo, branch, slug }));
  cacheLife("days");

  const source = await fetchDocFile(repo, branch, slug);
  const url = `/docs/${repo}/${branch}/${slug}`;
  const segments = slug.split("/");
  const breadcrumbs = [
    toTitleCase(repo),
    ...segments.slice(0, -1).map(toTitleCase),
  ];

  if (!source) {
    return {
      id: url,
      title: toTitleCase(segments.at(-1) ?? slug),
      url,
      breadcrumbs,
      headings: [],
    };
  }

  const { headings: rawHeadings, contents } = extractStructure(source);

  const headings: DocHeading[] = rawHeadings.map((h) => ({
    id: h.id,
    title: h.content,
    depth: h.depth,
  }));

  const title = rawHeadings[0]?.content ?? toTitleCase(segments.at(-1) ?? slug);
  const description = contents.find((c) => c.heading === undefined)?.content;

  return { id: url, title, description, url, breadcrumbs, headings };
}

// ── Layer 2: Per-branch doc tree ─────────────────────────────────────────────

export async function getDocTreeCached(
  repo: string,
  branch: string,
): Promise<DocTree> {
  cacheTag(docsTreeTag({ repo, branch }));
  cacheLife("days");

  const gitTree = await fetchGitTree(repo, branch);
  return buildDocTree(repo, branch, gitTree);
}

// ── Layer 3: Per-repo branch list ────────────────────────────────────────────

export async function getDocBranchesCached(
  repo: string,
): Promise<BranchInfo[]> {
  cacheTag(docsBranchesTag({ repo }));
  cacheLife("days");

  return fetchBranches(repo);
}

// ── Layer 4: Per-repo search index (composite) ──────────────────────────────

export async function getDocsSearchIndex(
  repo: string,
): Promise<DocPageEntry[]> {
  cacheTag(docsSearchIndexTag({ repo }));
  cacheLife("days");

  const branches = await getDocBranchesCached(repo);
  const branch = branches.find((b) => b.isDefault)?.name ?? "main";
  const { entries } = await getDocTreeCached(repo, branch);

  const pages = await Promise.all(
    entries.map(async (entry) => {
      const slug = stripExt(entry.path);
      return getDocFileEntries(repo, branch, slug);
    }),
  );

  return pages;
}

