"use client";

import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "fumadocs-ui/components/ui/popover";
import {
  LuBookmark,
  LuCheck,
  LuChevronsUpDown,
  LuGitBranch,
  LuGitPullRequestArrow,
} from "react-icons/lu";
import type * as PageTree from "fumadocs-core/page-tree";
import { getDocBranches, getDocTreeNodes } from "~/server/docs/actions";
import type { BranchInfo } from "~/server/docs/github";
import type { EdgeConfigSchema } from "~/server/edgeConfig";
import DocTreeRenderer from "./DocTreeRenderer";

interface Props {
  repos: EdgeConfigSchema<"docs">;
  onFirstHref?: (href: string) => void;
}

const STORAGE_KEY = "sidebarDocsState";

function cn(...classes: (string | undefined | false | null)[]) {
  return classes.filter(Boolean).join(" ");
}

function FumaSelect({
  value,
  onChange,
  options,
  placeholder,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        disabled={disabled}
        className="bg-fd-secondary/50 text-fd-secondary-foreground hover:bg-fd-accent hover:text-fd-accent-foreground data-[state=open]:bg-fd-accent data-[state=open]:text-fd-accent-foreground flex w-full items-center gap-2 rounded-md border px-2 py-1.5 text-start text-sm transition-colors disabled:cursor-default disabled:opacity-50"
      >
        <span className="flex-1 truncate">
          {selected?.label ?? placeholder ?? "Select…"}
        </span>
        <LuChevronsUpDown className="text-fd-muted-foreground size-3.5 shrink-0" />
      </PopoverTrigger>
      <PopoverContent className="flex w-(--radix-popover-trigger-width) flex-col gap-0.5 p-1">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => {
              onChange(option.value);
              setOpen(false);
            }}
            className="hover:bg-fd-accent hover:text-fd-accent-foreground flex items-center gap-2 rounded-md px-2 py-1.5 text-sm"
          >
            <span className="flex-1 text-start">{option.label}</span>
            {option.value === value && (
              <LuCheck className="text-fd-primary size-3 shrink-0" />
            )}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}

function getBranchMeta(b: BranchInfo): {
  icon: React.ReactNode;
  description?: string;
} {
  if (b.isDefault)
    return {
      icon: <LuBookmark className="size-3.5" />,
      description: "Default Branch",
    };
  if (b.name === "dev")
    return {
      icon: <LuGitPullRequestArrow className="size-3.5" />,
      description: "Target for Pull Requests",
    };
  return { icon: <LuGitBranch className="size-3.5" /> };
}

function BranchSelect({
  branches,
  value,
  onChange,
  disabled,
  loading,
}: {
  branches: BranchInfo[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const selected = branches.find((b) => b.name === value);
  const selectedMeta = selected ? getBranchMeta(selected) : null;

  const featured = branches
    .filter((b) => b.isDefault || b.name === "dev")
    .sort((a) => (a.isDefault ? -1 : 1));
  const others = branches.filter((b) => !b.isDefault && b.name !== "dev");

  function renderItem(b: BranchInfo) {
    const { icon, description } = getBranchMeta(b);
    const isActive = b.name === value;
    return (
      <button
        key={b.name}
        type="button"
        onClick={() => {
          onChange(b.name);
          setOpen(false);
        }}
        className="hover:bg-fd-accent hover:text-fd-accent-foreground flex items-center gap-2 rounded-md px-1.5 py-1.5 text-sm"
      >
        <div className="text-fd-muted-foreground flex size-4 shrink-0 items-center justify-center">
          {icon}
        </div>
        <div className="flex-1 text-start">
          <p className="leading-none font-medium">{b.name}</p>
          {description && (
            <p className="text-fd-muted-foreground mt-0.5 text-[0.7rem]">
              {description}
            </p>
          )}
        </div>
        <LuCheck
          className={cn(
            "text-fd-primary size-3 shrink-0",
            !isActive && "invisible",
          )}
        />
      </button>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        disabled={disabled}
        className="bg-fd-secondary/50 text-fd-secondary-foreground hover:bg-fd-accent hover:text-fd-accent-foreground data-[state=open]:bg-fd-accent data-[state=open]:text-fd-accent-foreground flex w-full items-center gap-2 rounded-md border px-2 py-1.5 text-start text-sm transition-colors disabled:cursor-default disabled:opacity-50"
      >
        {selectedMeta && (
          <span className="flex size-3.5 shrink-0 items-center justify-center">
            {selectedMeta.icon}
          </span>
        )}
        <span className="flex-1 truncate">
          {loading ? "Loading…" : (selected?.name ?? "Select branch…")}
        </span>
        <LuChevronsUpDown className="text-fd-muted-foreground size-3.5 shrink-0" />
      </PopoverTrigger>
      <PopoverContent className="flex w-(--radix-popover-trigger-width) flex-col gap-0.5 p-1">
        {featured.map(renderItem)}
        {others.length > 0 && (
          <>
            <hr className="border-fd-border my-0.5" />
            {others.map(renderItem)}
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}

function findFirstHref(nodes: PageTree.Node[]): string | null {
  for (const node of nodes) {
    if (node.type === "page") return node.url;
    if (node.type === "folder") {
      if (node.index) return node.index.url;
      const h = findFirstHref(node.children);
      if (h) return h;
    }
  }
  return null;
}

export default function SidebarDocsSection({ repos, onFirstHref }: Props) {
  const pathname = usePathname();

  const [selectedRepo, setSelectedRepo] = useState<string>("");
  const [branches, setBranches] = useState<BranchInfo[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>("");
  const [treeNodes, setTreeNodes] = useState<PageTree.Node[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [loadingPages, setLoadingPages] = useState(false);

  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;
  const hasCalledOnFirstHref = useRef(false);

  const urlRepo = useMemo(() => {
    if (pathname.startsWith("/docs/")) {
      const slug = pathname.slice("/docs/".length).split("/")[0] ?? "";
      return repos.find((r) => r.slug === slug) ? slug : null;
    }
    return null;
  }, [pathname, repos]);

  useEffect(() => {
    if (urlRepo !== null) {
      setSelectedRepo(urlRepo);
      return;
    }
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const { repo } = JSON.parse(raw) as { repo: string; branch: string };
        if (repos.find((r) => r.slug === repo)) {
          setSelectedRepo(repo);
          return;
        }
      }
    } catch {
      // ignore
    }
    setSelectedRepo(repos[0]?.slug ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (urlRepo !== null) setSelectedRepo(urlRepo);
  }, [urlRepo]);

  useEffect(() => {
    if (!selectedRepo) return;
    setLoadingBranches(true);
    setBranches([]);
    setSelectedBranch("");
    setTreeNodes([]);

    getDocBranches(selectedRepo)
      .then((data) => {
        setBranches(data);

        const pn = pathnameRef.current;
        const prefix = `/docs/${selectedRepo}/`;
        if (pn.startsWith(prefix)) {
          const segments = pn.slice(prefix.length).split("/");
          for (let len = segments.length; len >= 1; len--) {
            const candidate = segments.slice(0, len).join("/");
            if (data.find((b) => b.name === candidate)) {
              setSelectedBranch(candidate);
              return;
            }
          }
        }

        try {
          const raw = localStorage.getItem(STORAGE_KEY);
          if (raw) {
            const { repo, branch } = JSON.parse(raw) as {
              repo: string;
              branch: string;
            };
            if (repo === selectedRepo && data.find((b) => b.name === branch)) {
              setSelectedBranch(branch);
              return;
            }
          }
        } catch {
          // ignore
        }

        setSelectedBranch(
          data.find((b) => b.isDefault)?.name ?? data[0]?.name ?? "",
        );
      })
      .catch((err: unknown) =>
        console.error("[SidebarDocsSection] getDocBranches error:", err),
      )
      .finally(() => setLoadingBranches(false));
  }, [selectedRepo]);

  useEffect(() => {
    if (!selectedRepo || !selectedBranch) return;
    setLoadingPages(true);
    setTreeNodes([]);

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ repo: selectedRepo, branch: selectedBranch }),
      );
    } catch {
      // ignore
    }

    getDocTreeNodes(selectedRepo, selectedBranch)
      .then(setTreeNodes)
      .catch((err: unknown) =>
        console.error("[SidebarDocsSection] getDocTreeNodes error:", err),
      )
      .finally(() => setLoadingPages(false));
  }, [selectedRepo, selectedBranch]);

  useEffect(() => {
    if (hasCalledOnFirstHref.current || !onFirstHref || treeNodes.length === 0)
      return;
    const href = findFirstHref(treeNodes);
    if (href) {
      hasCalledOnFirstHref.current = true;
      onFirstHref(href);
    }
  }, [treeNodes, onFirstHref]);

  return (
    <div className="flex flex-col gap-2 py-1">
      <FumaSelect
        value={selectedRepo}
        onChange={setSelectedRepo}
        options={repos.map((r) => ({ value: r.slug, label: r.name }))}
        placeholder="Select repository…"
      />

      {selectedRepo && (
        <BranchSelect
          branches={branches}
          value={selectedBranch}
          onChange={setSelectedBranch}
          loading={loadingBranches}
          disabled={loadingBranches || branches.length === 0}
        />
      )}

      {selectedBranch &&
        (loadingPages ? (
          <p className="animate-pulse px-1 py-2 text-sm text-mauve-500">
            Loading…
          </p>
        ) : (
          <DocTreeRenderer nodes={treeNodes} />
        ))}
    </div>
  );
}
