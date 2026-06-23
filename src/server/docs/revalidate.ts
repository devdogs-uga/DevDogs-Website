import { revalidateTag } from "next/cache";
import {
  docsBranchesTag,
  docsFileSearchTag,
  docsSearchIndexTag,
  docsTreeTag,
} from "~/server/manifest/cache";
import { stripExt } from "./utils";

export function revalidateDocPaths(
  repo: string,
  branch: string,
  added: string[],
  modified: string[],
  removed: string[],
) {
  revalidateTag(docsBranchesTag({ repo }), "max");
  revalidateTag(docsSearchIndexTag({ repo }), "max");

  const allChanged = [...added, ...modified, ...removed];
  const hasStructuralChange = added.length > 0 || removed.length > 0;

  if (hasStructuralChange) {
    revalidateTag(docsTreeTag({ repo, branch }), "max");
  }

  for (const path of allChanged) {
    if (path.startsWith("docs/") && /\.(md|mdx)$/.test(path)) {
      const slug = stripExt(path.slice("docs/".length));
      revalidateTag(docsFileSearchTag({ repo, branch, slug }), "max");
    } else if (
      path === "docs/meta.json" ||
      path.match(/^docs\/.+\/meta\.json$/)
    ) {
      revalidateTag(docsTreeTag({ repo, branch }), "max");
    }
  }
}
