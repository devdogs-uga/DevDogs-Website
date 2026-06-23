import type { ResolvedPermissions } from "~/server/actions/permissions";
import type { RestrictVisibility } from "./types";

export function isVisible(
  rule: RestrictVisibility,
  permissions: ResolvedPermissions | null,
): boolean {
  if (rule === false) return true;
  if (permissions === null) return false;

  return rule.some((required) =>
    Object.entries(required).every(
      ([key, value]) =>
        !value || permissions[key as keyof ResolvedPermissions],
    ),
  );
}
