import { createId } from "@paralleldrive/cuid2";
import { sql, type SQL } from "drizzle-orm";
import { primaryKey } from "drizzle-orm/pg-core";
import {
  pgTable,
  pgEnum,
  uniqueIndex,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";
import { generateSecureString } from "~/server/utilts";

function lower(col: AnyPgColumn): SQL {
  return sql`(lower(${col}))`;
}

export const providerEnum = pgEnum("provider", ["google", "discord", "github"]);

export const SERVER_ONLY_DO_NOT_LEAK_accessTokens = pgTable(
  "access_token",
  (d) => ({
    id: d.varchar({ length: 255 }).primaryKey().$defaultFn(createId),
    accessToken: d.text().notNull(),
    accessTokenExpires: d.timestamp(),
    refreshToken: d.text(),
  }),
);

export const authorizationCodes = pgTable("authorization_code", (d) => ({
  code: d
    .varchar({ length: 255 })
    .primaryKey()
    .$defaultFn(() => generateSecureString(128)),
  clientId: d.varchar({ length: 255 }).references(() => oauthKeys.clientId, {
    onDelete: "set null",
    onUpdate: "cascade",
  }),
  redirectUri: d.text().notNull(),
  state: d.text(),
  userId: d
    .varchar({ length: 255 })
    .references(() => users.id, { onDelete: "set null", onUpdate: "cascade" }),
  createdAt: d.timestamp().defaultNow().notNull(),
}));

export const oauthKeys = pgTable("oauth_key", (d) => ({
  userId: d
    .varchar({ length: 255 })
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
  clientId: d
    .varchar({ length: 255 })
    .$defaultFn(() => generateSecureString(128))
    .notNull()
    .unique(),
  clientSecret: d.varchar({ length: 255 }).notNull().unique(),
  lastUpdated: d
    .timestamp()
    .notNull()
    .$defaultFn(() => new Date()),
}));

export const users = pgTable("user", (d) => ({
  id: d.varchar({ length: 255 }).primaryKey().$defaultFn(createId),
  ugaMyId: d.varchar({ length: 255 }).notNull(),
  legalName: d.varchar({ length: 255 }).notNull(),
  viewedSettings: d.boolean().notNull().default(false),
  createdAt: d.timestamp().defaultNow().notNull(),
  githubId: d.integer().references(() => githubProfiles.id, {
    onDelete: "set null",
    onUpdate: "cascade",
  }),
  discordId: d.varchar({ length: 255 }).references(() => discordProfiles.id, {
    onDelete: "set null",
    onUpdate: "cascade",
  }),
}));

export const publicProfiles = pgTable("public_profile", (d) => ({
  userId: d
    .varchar({ length: 255 })
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
  name: d.varchar({ length: 255 }).notNull(),
  email: d.varchar({ length: 255 }),
  image: d.text(),
  githubUsername: d.varchar({ length: 255 }),
  discordUsername: d.varchar({ length: 255 }),
  linkedinUsername: d.varchar({ length: 255 }),
  instagramUsername: d.varchar({ length: 255 }),
  portfolioUrl: d.text(),
}));

export const githubProfiles = pgTable(
  "github_profile",
  (d) => ({
    id: d.integer().primaryKey(),
    login: d.varchar({ length: 255 }).unique().notNull(),
    avatarUrl: d.text(),
    allTimePoints: d.integer().notNull().default(0),
    allTimeRanking: d.integer(),
    currentYearPoints: d.integer().notNull().default(0),
    currentYearRanking: d.integer(),
    accessTokenId: d
      .varchar({ length: 255 })
      .references(() => SERVER_ONLY_DO_NOT_LEAK_accessTokens.id, {
        onUpdate: "cascade",
        onDelete: "set null",
      }),
  }),
  (t) => [uniqueIndex("login_idx").on(lower(t.login))],
);

export const points = pgTable(
  "points",
  (d) => ({
    githubProfileId: d
      .integer()
      .notNull()
      .references(() => githubProfiles.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    year: d.integer().notNull(),
    streakStart: d
      .date({ mode: "date" })
      .notNull()
      .$defaultFn(() => new Date()),
    streakLength: d.integer().notNull().default(0),
    longestStreakLength: d.integer().notNull().default(0),
    projectPoints: d.integer().notNull().default(0),
    streakBonusPoints: d.integer().notNull().default(0),
    academyPoints: d.integer().notNull().default(0),
    points: d
      .integer()
      .notNull()
      .generatedAlwaysAs(
        (): SQL =>
          sql`${points.projectPoints} + ${points.streakBonusPoints} + ${points.academyPoints}`,
      ),
  }),
  (t) => [primaryKey({ columns: [t.githubProfileId, t.year] })],
);

export const discordProfiles = pgTable(
  "discord_profile",
  (d) => ({
    id: d.varchar({ length: 255 }).primaryKey(),
    username: d.varchar({ length: 255 }).notNull(),
    avatar: d.varchar({ length: 255 }),
    accessTokenId: d
      .varchar({ length: 255 })
      .references(() => SERVER_ONLY_DO_NOT_LEAK_accessTokens.id, {
        onUpdate: "cascade",
        onDelete: "set null",
      }),
  }),
  (t) => [uniqueIndex("username_idx").on(lower(t.username))],
);

export const sessions = pgTable("session", (d) => ({
  token: d
    .varchar({ length: 255 })
    .primaryKey()
    .$defaultFn(() =>
      Buffer.from(crypto.getRandomValues(new Uint8Array(128))).toString(
        "base64",
      ),
    ),
  userAgent: d.text(),
  userId: d
    .varchar({ length: 255 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
  createdAt: d.timestamp().defaultNow().notNull(),
}));

export const oauthStates = pgTable("oauth_state", (d) => ({
  token: d
    .varchar({ length: 255 })
    .primaryKey()
    .$defaultFn(() => generateSecureString(128)),
  provider: providerEnum().notNull(),
  callbackPath: d.text().notNull().default("/"),
  createdAt: d.timestamp().defaultNow().notNull(),
}));
