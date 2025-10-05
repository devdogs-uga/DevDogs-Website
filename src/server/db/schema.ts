import { createId } from "@paralleldrive/cuid2";
import { sql, type SQL } from "drizzle-orm";
import {
  mysqlTable,
  timestamp,
  uniqueIndex,
  type AnyMySqlColumn
} from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm/relations";

export function lower(email: AnyMySqlColumn): SQL {
  return sql`(lower(${email}))`;
}

export const users = mysqlTable(
  "user",
  (d) => ({
    id: d.varchar({ length: 255 }).primaryKey().$defaultFn(createId),
    email: d.varchar({ length: 255 }).notNull(),
    type: d.mysqlEnum(["user", "organization"]).notNull(),
    name: d.varchar({ length: 255 }).notNull(),
    image: d.varchar({ length: 255 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").onUpdateNow(),
  }),
  (t) => [uniqueIndex("email_idx").on(lower(t.email))],
);

export const sessions = mysqlTable("session", (d) => ({
  createdAt: d.timestamp().defaultNow().notNull(),
  userAgent: d.text(),
  userId: d
    .varchar({ length: 255 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: d
    .varchar({ length: 255 })
    .primaryKey()
    .$defaultFn(() =>
      Buffer.from(crypto.getRandomValues(new Uint8Array(128))).toString(
        "base64",
      ),
    ),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));
