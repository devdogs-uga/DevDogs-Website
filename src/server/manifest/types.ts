import type { ResolvedPermissions } from "~/server/actions/permissions";

/**
 * `false` = always visible.
 * Array = user must have ALL `true` permissions in at least ONE item.
 * `[{}]` = signed-in only (no specific permissions required).
 */
export type RestrictVisibility =
  | false
  | [Partial<ResolvedPermissions>, ...Partial<ResolvedPermissions>[]];

export interface ManifestPage {
  type: "page";
  id: string;
  name: string;
  description?: string;
  url: string;
  icon: string;
  restrictVisibility: RestrictVisibility;
  showInSidebar?: boolean;
  sections?: ManifestSection[];
}

export interface ManifestFolder {
  type: "folder";
  id: string;
  name: string | null;
  children: ManifestNode[];
  defaultOpen?: boolean;
}

export type ManifestNode = ManifestPage | ManifestFolder;

export interface ManifestRoot {
  name: string;
  children: ManifestFolder[];
}

export interface ManifestSection {
  id: string;
  title: string;
  description?: string;
  restrictVisibility: RestrictVisibility;
  fields?: ManifestField[];
}

export interface ManifestField {
  id: string;
  title: string;
  description?: string;
  restrictVisibility: RestrictVisibility;
}

export interface DocHeading {
  id: string;
  title: string;
  description?: string;
  depth: number;
}

export interface DocPageEntry {
  id: string;
  title: string;
  description?: string;
  url: string;
  breadcrumbs: string[];
  headings: DocHeading[];
}
