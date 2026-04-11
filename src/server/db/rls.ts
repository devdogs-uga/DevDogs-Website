import { eq, is, sql, type ColumnType, type SQL } from "drizzle-orm";
import {
  pgPolicy,
  PgRole,
  type ExtraConfigColumn,
  type PgColumnBaseConfig,
  type PgPolicyToOption,
} from "drizzle-orm/pg-core";
import { authUid } from "drizzle-orm/supabase";

interface CrudPolicyOptions {
  create?: SQL<unknown>;
  read?: SQL<unknown>;
  update?: SQL<unknown>;
  delete?: SQL<unknown>;
}

function getRoleName(role: PgPolicyToOption) {
  if (Array.isArray(role)) {
    return role
      .map((it) => (is(it, PgRole) ? it.name : (it as string)))
      .join("-");
  }

  return is(role, PgRole) ? role.name : (role as string);
}

export function authorizedAs(
  userId: ExtraConfigColumn<PgColumnBaseConfig<ColumnType>>,
) {
  return eq(authUid, userId);
}

export function crudPolicy(role: PgPolicyToOption, allow: CrudPolicyOptions) {
  const roleName = getRoleName(role);

  return [
    pgPolicy(`crud_${roleName}_policy_insert`, {
      as: allow.create ? "permissive" : "restrictive",
      to: role,
      for: "insert",
      withCheck: allow.create ?? sql`false`,
    }),
    pgPolicy(`crud_${roleName}_policy_select`, {
      as: allow.read ? "permissive" : "restrictive",
      to: role,
      for: "select",
      using: allow.read ?? sql`false`,
    }),
    pgPolicy(`crud_${roleName}_policy_update`, {
      as: allow.delete ? "permissive" : "restrictive",
      to: role,
      for: "update",
      using: allow.update ?? sql`false`,
      withCheck: allow.update ?? sql`false`,
    }),
    pgPolicy(`crud_${roleName}_policy_delete`, {
      as: allow.delete ? "permissive" : "restrictive",
      to: role,
      for: "delete",
      using: allow.delete ?? sql`false`,
    }),
  ];
}
