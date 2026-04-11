import { notFound } from "next/navigation";
import { DocsLayout } from "fumadocs-ui/layouts/docs";
import {
  buildPageTree,
  getDocsTree,
  listBranches,
  listDocsRepos,
} from "~/server/github/githubDocs";
import { RepoSwitcher } from "~/components/docs/RepoSwitcher";

export const dynamic = "force-dynamic";

interface Props {
  children: React.ReactNode;
  params: Promise<{ repo: string; branch: string }>;
}

export default async function RepoBranchLayout({ children, params }: Props) {
  const { repo, branch } = await params;

  const [entries, branches, repos] = await Promise.all([
    getDocsTree(repo, branch),
    listBranches(repo),
    listDocsRepos(),
  ]);

  if (branches.length === 0) notFound();

  const tree = buildPageTree(repo, branch, entries);

  return (
    <DocsLayout
      tree={tree}
      nav={{ title: repo }}
      sidebar={{
        footer: (
          <RepoSwitcher
            currentRepo={repo}
            currentBranch={branch}
            repos={repos}
            branches={branches}
          />
        ),
      }}
    >
      {children}
    </DocsLayout>
  );
}
