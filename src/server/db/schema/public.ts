import { sql, type SQL } from "drizzle-orm";
import { pgEnum, pgTable, primaryKey, uniqueIndex } from "drizzle-orm/pg-core";
import { authenticatedRole } from "drizzle-orm/supabase";
import { oauthClientsInAuth, usersInAuth } from "~/supabase/drizzle/schema";
import { authorizedAs, crudPolicy } from "../rls";
import { lower } from "../utils";

/**
 * `preferredName` is stored here (not in `auth.users`) because Supabase
 * re-merges OAuth provider data on every sign-in, which would overwrite any
 * preferred name stored in `raw_user_meta_data`. A `custom_access_token` hook
 * (see `supabase/hooks/custom_access_token.sql`) injects `preferredName` into
 * the OIDC `name` claim so OAuth clients always see the up-to-date value.
 *
 * Email is read directly from `auth.users.email`.
 */
export const profiles = pgTable(
  "profile",
  (d) => ({
    userId: d
      .uuid()
      .primaryKey()
      .references(() => usersInAuth.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    preferredName: d.varchar({ length: 255 }).notNull(),
    showGithub: d.boolean().notNull().default(false),
    showDiscord: d.boolean().notNull().default(false),
    viewedSettings: d.boolean().notNull().default(false),
  }),
  // Authenticated users may only read and update their own profile row.
  // INSERT is handled server-side on first sign-in; DELETE cascades from auth.users.
  (table) => [
    crudPolicy(authenticatedRole, {
      create: authorizedAs(table.userId),
      update: authorizedAs(table.userId),
    }),
  ],
);

export const profileLinks = pgTable(
  "profileLinks",
  (d) => ({
    id: d.uuid().primaryKey().defaultRandom(),
    userId: d
      .uuid()
      .notNull()
      .references(() => profiles.userId, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    url: d.text().notNull(),
    title: d.varchar({ length: 64 }).notNull(),
    createdAt: d.timestamp().defaultNow(),
  }),
  // Full CRUD for authenticated users on their own links.
  (table) => [
    crudPolicy(authenticatedRole, {
      create: authorizedAs(table.userId),
      read: authorizedAs(table.userId),
      update: authorizedAs(table.userId),
      delete: authorizedAs(table.userId),
    }),
  ],
);

export const oauthRegistrationTypeEnum = pgEnum("oauthRegistrationType", [
  "development",
  "production",
]);

/**
 * Supabase OAuth client ID for a user's registered OAuth application.
 * Managed exclusively by the backend via supabaseAdmin (service_role).
 * The secret is never stored here; it is returned once by the admin API.
 *
 * `type` distinguishes "development" clients (created by users via the
 * DevDogs website, require consent and test-account selection) from
 * "production" clients (created manually via the Supabase dashboard,
 * auto-approved without user interaction).
 */
export const oauthRegistrations = pgTable(
  "oauthRegistrations",
  (d) => ({
    clientId: d
      .uuid()
      .primaryKey()
      .references(() => oauthClientsInAuth.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    userId: d
      .uuid()
      .notNull()
      .unique()
      .references(() => usersInAuth.id, {
        onDelete: "restrict",
        onUpdate: "cascade",
      }),
    type: oauthRegistrationTypeEnum().notNull().default("development"),
  }),
  () => [crudPolicy("public", {})],
);

/**
 * Fake test accounts for a development OAuth client.
 * Each test account is backed by a real `auth.users` row (created via the
 * admin API with `is_test_account: true` in raw_user_meta_data) so that the
 * issued JWT is a fully valid Supabase session.
 *
 * `userId` is the primary key — each `auth.users` row can only back one
 * test account globally.
 *
 * The `auth.users` row is created with a throwaway internal email so uniqueness
 * is always guaranteed. `email` here is the display email injected into token
 * claims by the custom_access_token hook — it does not need to be unique.
 *
 * Ownership is derived via `clientId → oauthClients.userId` so no redundant
 * `userId` column is needed here.
 *
 * ⚠ SECURITY NOTE: Because test account tokens are real Supabase JWTs, any
 * table whose RLS policy grants SELECT to all authenticated users
 * (e.g. `for: "select", using: sql\`true\`` on the "authenticated" role)
 * would be readable by a test token. Keep all user-facing tables owner-scoped.
 * If broad authenticated-read access is ever needed, filter out test accounts:
 *   (auth.jwt()->'user_metadata'->>'is_test_account') IS NULL
 */
export const oauthTestAccounts = pgTable(
  "oauthTestAccounts",
  (d) => ({
    testUserId: d
      .uuid()
      .primaryKey()
      .references(() => usersInAuth.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    ownerUserId: d
      .uuid()
      .notNull()
      .unique()
      .references(() => usersInAuth.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    createdAt: d.timestamp().notNull().defaultNow(),
  }),
  () => [crudPolicy("public", {})],
);

/**
 * One row per GitHub contributor to the DevDogs organisation.
 * Populated and updated by `syncLeaderboard`. The primary key is the GitHub
 * numeric user ID stored as `varchar` so it can be joined directly against
 * `auth.identities.provider_user_id` without a cast.
 */
export const leaderboardProfiles = pgTable(
  "leaderboardProfiles",
  (d) => ({
    githubId: d.varchar({ length: 255 }).primaryKey(),
    githubLogin: d.varchar({ length: 255 }).unique().notNull(),
    avatarUrl: d.text(),
    allTimePoints: d.integer().notNull().default(0),
    allTimeRanking: d.integer(),
    currentYearPoints: d.integer().notNull().default(0),
    currentYearRanking: d.integer(),
  }),
  (t) => [
    uniqueIndex("login_idx").on(lower(t.githubLogin)),
    crudPolicy("public", {}),
  ],
);

export const points = pgTable(
  "points",
  (d) => ({
    leaderboardProfileId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => leaderboardProfiles.githubId, {
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
  (t) => [
    primaryKey({ columns: [t.leaderboardProfileId, t.year] }),
    crudPolicy("public", {}),
  ],
);
