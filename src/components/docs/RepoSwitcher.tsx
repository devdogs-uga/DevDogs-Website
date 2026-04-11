"use client";

import { useRouter } from "next/navigation";
import type { BranchInfo } from "~/server/github/githubDocs";

interface Props {
  currentRepo: string;
  currentBranch: string;
  repos: string[];
  branches: BranchInfo[];
}

export function RepoSwitcher({
  currentRepo,
  currentBranch,
  repos,
  branches,
}: Props) {
  const router = useRouter();

  function handleRepoChange(repo: string) {
    const defaultBranch =
      branches.find((b) => b.isDefault)?.name ?? branches[0]?.name ?? "main";
    router.push(`/docs/${repo}/${defaultBranch}`);
  }

  function handleBranchChange(branch: string) {
    router.push(`/docs/${currentRepo}/${branch}`);
  }

  return (
    <div className="flex flex-col gap-2 p-2 text-sm">
      <label className="flex flex-col gap-1">
        <span className="text-xs font-semibold text-fd-muted-foreground uppercase tracking-wide">
          Repository
        </span>
        <select
          value={currentRepo}
          onChange={(e) => handleRepoChange(e.target.value)}
          className="rounded border border-fd-border bg-fd-background px-2 py-1 text-fd-foreground"
        >
          {repos.map((repo) => (
            <option key={repo} value={repo}>
              {repo}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-semibold text-fd-muted-foreground uppercase tracking-wide">
          Branch
        </span>
        <select
          value={currentBranch}
          onChange={(e) => handleBranchChange(e.target.value)}
          className="rounded border border-fd-border bg-fd-background px-2 py-1 text-fd-foreground"
        >
          {branches.map((b) => (
            <option key={b.name} value={b.name}>
              {b.name}
              {b.isDefault ? " (default)" : ""}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
