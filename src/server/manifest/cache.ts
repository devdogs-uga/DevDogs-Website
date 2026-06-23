/** Tag builders for docs cache invalidation. Used by both cacheTag() and revalidateTag() call sites. */

export function docsBranchesTag({ repo }: { repo: string }) {
  return `docs-branches-${repo}`;
}

export function docsTreeTag({
  repo,
  branch,
}: {
  repo: string;
  branch: string;
}) {
  return `docs-tree-${repo}-${branch}`;
}

export function docsFileSearchTag({
  repo,
  branch,
  slug,
}: {
  repo: string;
  branch: string;
  slug: string;
}) {
  return `docs-search-${repo}-${branch}-${slug}`;
}

export function docsSearchIndexTag({ repo }: { repo: string }) {
  return `docs-search-index-${repo}`;
}
