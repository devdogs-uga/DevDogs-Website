import { notFound } from "next/navigation";
import { getDocFile } from "~/server/github/githubDocs";
import { DocPageContent } from "~/components/docs/DocPageContent";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ repo: string; branch: string; slug: string[] }>;
}

export default async function DocSlugPage({ params }: Props) {
  const { repo, branch, slug } = await params;
  const slugPath = slug.join("/");

  const source = await getDocFile(repo, branch, slugPath);
  if (!source) notFound();

  return <DocPageContent source={source} />;
}
