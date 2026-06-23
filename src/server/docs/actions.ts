"use server";

import type { ManifestFolder, ManifestNode, ManifestPage } from "~/server/manifest/types";
import type { BranchInfo } from "./github";
import {
  getDocBranchesCached,
  getDocTreeCached,
} from "~/server/manifest/docs/cached";
import { stripExt, toTitleCase } from "./utils";

export async function getDocBranches(repo: string): Promise<BranchInfo[]> {
  return await getDocBranchesCached(repo);
}

export async function getDocTreeNodes(
  repo: string,
  branch: string,
): Promise<ManifestNode[]> {
  const { entries, metaByFolder } = await getDocTreeCached(repo, branch);
  const baseUrl = `/docs/${repo}/${branch}`;

  const folders = new Map<string, ManifestFolder>();
  const roots: ManifestNode[] = [];

  const sorted = [...entries].sort((a, b) => {
    const aDepth = a.path.split("/").length;
    const bDepth = b.path.split("/").length;
    return aDepth - bDepth;
  });

  for (const entry of sorted) {
    const stripped = stripExt(entry.path);
    const parts = stripped.split("/");
    const fileName = parts.at(-1)!;
    const folderPath = parts.slice(0, -1).join("/");
    const isIndex =
      !!folderPath &&
      (fileName === "index" || fileName.toLowerCase() === "readme");
    const href = `${baseUrl}/${isIndex ? parts.slice(0, -1).join("/") : stripped}`;
    const title =
      entry.label ??
      toTitleCase(isIndex ? (parts.at(-2) ?? fileName) : fileName);

    const node: ManifestPage = {
      type: "page",
      id: href,
      name: title,
      url: href,
      icon: "FileText",
      restrictVisibility: false,
    };

    if (folderPath) {
      let folder = folders.get(folderPath);
      if (!folder) {
        const folderName = folderPath.split("/").at(-1) ?? folderPath;
        folder = {
          type: "folder",
          id: `${baseUrl}/${folderPath}`,
          name: metaByFolder.get(folderPath)?.title ?? toTitleCase(folderName),
          children: [],
        };
        folders.set(folderPath, folder);
        const parentPath = folderPath.split("/").slice(0, -1).join("/");
        if (parentPath) {
          const parent = folders.get(parentPath);
          if (parent) {
            parent.children.push(folder);
          }
        } else {
          roots.push(folder);
        }
      }
      if (isIndex) {
        // For index pages, add as first child of the folder
        folder.children.unshift(node);
      } else {
        folder.children.push(node);
      }
    } else {
      roots.push(node);
    }
  }

  return roots;
}

export async function resolveBranchAndSlug(
  repo: string,
  path: string[],
): Promise<{ branch: string; slug: string[]; branches: BranchInfo[] } | null> {
  const branches = await getDocBranchesCached(repo);
  const branchNames = new Set(branches.map((b) => b.name));

  for (let i = path.length; i >= 1; i--) {
    const candidate = path.slice(0, i).join("/");
    if (branchNames.has(candidate)) {
      return { branch: candidate, slug: path.slice(i), branches };
    }
  }

  return null;
}
