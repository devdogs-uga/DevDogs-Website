"use cache";

import { redirect } from "next/navigation";
import { cacheLife } from "next/cache";
import { getEdgeConfig } from "~/server/edgeConfig";
import { getDocBranchesCached } from "~/server/manifest/docs/cached";

export default async function DocsIndexPage() {
  cacheLife("days");

  const repos = await getEdgeConfig("docs");
  const first = repos[0];
  if (!first) redirect("/");

  const branches = await getDocBranchesCached(first.slug);
  const defaultBranch = branches.find((b) => b.isDefault)?.name ?? "main";

  redirect(`/docs/${first.slug}/${defaultBranch}`);
}
