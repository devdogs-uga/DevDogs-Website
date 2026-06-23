"use cache";

import { notFound, redirect } from "next/navigation";
import { cacheLife, cacheTag } from "next/cache";
import { env } from "~/env";
import { resolveBranchAndSlug } from "~/server/docs/actions";
import { fetchDocFile } from "~/server/docs/github";
import { getDocFileEntries } from "~/server/manifest/docs/cached";
import { docsFileSearchTag } from "~/server/manifest/cache";
import { toTitleCase } from "~/server/docs/utils";
import DocPageContent from "~/components/DocPageContent";

const GITHUB_BASE = `https://github.com/${env.GITHUB_ORG}`;

interface Props {
  params: Promise<{ path: string[] }>;
}

export default async function DocPage({ params }: Props) {
  const { path } = await params;
  cacheLife("days");

  if (path.length < 2) {
    const repo = path[0];
    if (!repo) notFound();
    const { resolveBranchAndSlug: resolve } = await import(
      "~/server/docs/actions"
    );
    const result = await resolve(repo, []);
    if (!result) notFound();
    redirect(`/docs/${repo}/${result.branch}`);
  }

  const repo = path[0]!;
  const rest = path.slice(1);

  const resolved = await resolveBranchAndSlug(repo, rest);
  if (!resolved) notFound();

  const { branch, slug } = resolved;

  const docSlug = slug.length > 0 ? slug.join("/") : "index";
  cacheTag(docsFileSearchTag({ repo, branch, slug: docSlug }));

  const [source, entry] = await Promise.all([
    fetchDocFile(repo, branch, docSlug),
    getDocFileEntries(repo, branch, docSlug),
  ]);

  if (!source && slug.length === 0) {
    const readmeSource = await fetchDocFile(repo, branch, "README");
    if (readmeSource) {
      const readmeEntry = await getDocFileEntries(repo, branch, "README");
      const breadcrumbs = [toTitleCase(repo)];
      const githubUrl = `${GITHUB_BASE}/${repo}/blob/${branch}/docs/README.md`;
      return (
        <DocPageContent
          source={readmeSource}
          headings={readmeEntry.headings}
          breadcrumbs={breadcrumbs}
          githubUrl={githubUrl}
        />
      );
    }
  }

  if (!source) notFound();

  const breadcrumbs = [
    toTitleCase(repo),
    ...docSlug
      .split("/")
      .slice(0, -1)
      .map(toTitleCase),
  ];
  const githubUrl = `${GITHUB_BASE}/${repo}/blob/${branch}/docs/${docSlug}.md`;

  return (
    <DocPageContent
      source={source}
      headings={entry.headings}
      breadcrumbs={breadcrumbs}
      githubUrl={githubUrl}
    />
  );
}
