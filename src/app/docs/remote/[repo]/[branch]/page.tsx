import { notFound } from "next/navigation";
import { getDocFile } from "~/server/github/githubDocs";
import { DocPageContent } from "~/components/docs/DocPageContent";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ repo: string; branch: string }>;
}

export default async function RepoBranchIndexPage({ params }: Props) {
  const { repo, branch } = await params;

  const source =
    (await getDocFile(repo, branch, "index")) ??
    (await getDocFile(repo, branch, "README"));

  if (!source) notFound();

  return <DocPageContent source={source} />;
}
