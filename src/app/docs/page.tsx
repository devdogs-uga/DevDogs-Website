import Link from "next/link";
import { listDocsRepos, listBranches } from "~/server/github/githubDocs";

export const dynamic = "force-dynamic";

export default async function DocsLandingPage() {
  const repos = await listDocsRepos();

  // Fetch default branch for each repo in parallel
  const repoData = await Promise.all(
    repos.map(async (repo) => {
      const branches = await listBranches(repo);
      const defaultBranch =
        branches.find((b) => b.isDefault)?.name ?? "main";
      return { repo, defaultBranch };
    }),
  );

  return (
    <main className="container mx-auto max-w-4xl px-4 py-16">
      <h1 className="mb-2 text-4xl font-bold">Documentation</h1>
      <p className="mb-10 text-fd-muted-foreground">
        Browse documentation for DevDogs projects.
      </p>

      {repoData.length === 0 ? (
        <p className="text-fd-muted-foreground">
          No repositories with a <code>docs/</code> folder found.
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {repoData.map(({ repo, defaultBranch }) => (
            <li key={repo}>
              <Link
                href={`/docs/${repo}/${defaultBranch}`}
                className="block rounded-lg border border-fd-border bg-fd-card p-5 transition-colors hover:bg-fd-accent"
              >
                <span className="font-semibold">{repo}</span>
                <span className="mt-1 block text-xs text-fd-muted-foreground">
                  {defaultBranch}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
