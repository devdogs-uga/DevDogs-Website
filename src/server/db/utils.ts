import { type ColumnType, type SQL, sql } from "drizzle-orm";
import type { ExtraConfigColumn, PgColumnBaseConfig } from "drizzle-orm/pg-core";

export function lower(
  col: ExtraConfigColumn<PgColumnBaseConfig<ColumnType>>,
): SQL {
  return sql`lower(${col})`;
}