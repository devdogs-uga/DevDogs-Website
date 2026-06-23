import { getEdgeConfig } from "~/server/edgeConfig";
import { getDocsSearchIndex } from "./cached";
import type { DocPageEntry } from "../types";

export async function getFullDocsSearchIndex(): Promise<DocPageEntry[]> {
  const repos = await getEdgeConfig("docs");
  const results = await Promise.all(
    repos.map((r) => getDocsSearchIndex(r.slug)),
  );
  return results.flat();
}
