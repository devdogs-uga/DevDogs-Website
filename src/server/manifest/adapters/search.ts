import type { ResolvedPermissions } from "~/server/actions/permissions";
import type { SearchEntry } from "~/server/search/types";
import { flattenAppPages } from "..";
import { isVisible } from "../visibility";
import type { DocPageEntry, RestrictVisibility } from "../types";

interface SearchCallerContext {
  permissions: ResolvedPermissions;
  credentials: Array<{ id: string; name: string; description: string | null }>;
}

function shouldShow(
  rule: RestrictVisibility,
  ctx: SearchCallerContext | null,
): boolean {
  if (rule === false) return true;
  if (!ctx) return false;
  return isVisible(rule, ctx.permissions);
}

export function buildAppSearchEntries(
  ctx: SearchCallerContext | null,
): SearchEntry[] {
  const entries: SearchEntry[] = [];
  const pages = flattenAppPages();

  for (const page of pages) {
    if (!shouldShow(page.restrictVisibility, ctx)) continue;

    entries.push({
      id: page.id,
      title: page.name,
      description: page.description,
      url: page.url,
      icon: page.icon,
      breadcrumbs: [page.group],
    });

    for (const section of page.sections ?? []) {
      if (!shouldShow(section.restrictVisibility, ctx)) continue;

      entries.push({
        id: `${page.id}#${section.id}`,
        title: section.title,
        description: section.description,
        url: `${page.url}#${section.id}`,
        icon: page.icon,
        breadcrumbs: [page.group, page.name],
      });

      for (const field of section.fields ?? []) {
        if (!shouldShow(field.restrictVisibility, ctx)) continue;

        entries.push({
          id: `${page.id}#${field.id}`,
          title: field.title,
          description: field.description,
          url: `${page.url}#${field.id}`,
          icon: page.icon,
          breadcrumbs: [page.group, page.name, section.title],
        });
      }
    }
  }

  if (ctx) {
    for (const c of ctx.credentials) {
      entries.push({
        id: `/console/credentials#credential-${c.id}`,
        title: c.name,
        description: c.description ?? undefined,
        url: `/console/credentials#credential-${c.id}`,
        icon: "KeyRound",
        breadcrumbs: ["Console", "Credentials"],
      });
    }
  }

  return entries;
}

export function flattenDocsToSearchEntries(
  pages: DocPageEntry[],
): SearchEntry[] {
  const entries: SearchEntry[] = [];

  for (const page of pages) {
    entries.push({
      id: page.id,
      title: page.title,
      description: page.description,
      url: page.url,
      icon: "FileText",
      breadcrumbs: page.breadcrumbs,
    });

    for (const heading of page.headings) {
      entries.push({
        id: `${page.id}#${heading.id}`,
        title: heading.title,
        description: heading.description,
        url: `${page.url}#${heading.id}`,
        icon: "Hash",
        breadcrumbs: [...page.breadcrumbs, page.title],
      });
    }
  }

  return entries;
}
