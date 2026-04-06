import { sql, type SQL } from "drizzle-orm";
import { primaryKey } from "drizzle-orm/pg-core";
import {
  pgSchema,
  pgTable,
  uniqueIndex,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";

export function lower(col: AnyPgColumn): SQL {
  return sql`lower(${col})`;
}

// ---------------------------------------------------------------------------
// Supabase auth schema — read-only references for cross-schema FK constraints
// and relational queries. drizzle-kit is configured with schemaFilter: ["public"]
// so it will not attempt to create or migrate anything in the auth schema.
//
// Shape validated against Supabase GoTrue v2 (postgres-migrations ≥ 20221208132122).
// Run `drizzle-kit pull --config drizzle.auth.config.ts` in CI to detect drift.
// ---------------------------------------------------------------------------
const authSchema = pgSchema("auth");

/**
 * Typed shape for the `raw_user_meta_data` JSONB column in `auth.users`.
 * Populated from the Google OAuth user-info response on first sign-in.
 */
export type UserMetaData = {
  /** Google display name. */
  full_name?: string;
  /** Fallback display name field. */
  name?: string;
  /** Avatar URL from the OAuth provider. */
  avatar_url?: string;
};

export const authUsers = authSchema.table("users", (d) => ({
  id: d.uuid().primaryKey(),
  email: d.text(),
  rawUserMetaData: d.jsonb("raw_user_meta_data").$type<UserMetaData>(),
}));

/**
 * Typed shape for the `identity_data` JSONB column in `auth.identities`.
 * The GoTrue server populates this from the OAuth provider's user-info
 * response. Field names vary by provider; all fields are optional.
 * `sub` and `user_name` are present for GitHub and Discord.
 *
 * Note: `@supabase/auth-js` types `identity_data` as `{ [key: string]: any }`,
 * so there is no upstream type to import — this definition is maintained here.
 */
export type IdentityData = {
  /** Provider user ID — mirrors `provider_user_id`. */
  sub?: string;
  /** Provider username/handle (GitHub login, Discord username, etc.). */
  user_name?: string;
  /** Display name. */
  name?: string;
  avatar_url?: string;
  email?: string;
};

/**
 * Read-only reference to `auth.identities`.
 * Each row represents one OAuth provider linked to a Supabase user.
 * `providerUserId` is the provider's own numeric/string ID for the account
 * (e.g. the GitHub numeric user ID, or the Discord snowflake ID).
 * `identityData` is the raw JSON returned by the provider — field names vary
 * per provider but typically include `user_name`/`name`/`avatar_url`.
 */
export const authIdentities = authSchema.table("identities", (d) => ({
  id: d.uuid().primaryKey(),
  userId: d.uuid("user_id").notNull(),
  provider: d.text().notNull(),
  providerUserId: d.text("provider_id").notNull(),
  identityData: d.jsonb("identity_data").$type<IdentityData>(),
}));

/**
 * Merged profile table — replaces the former `public_profile` and `onboarding`
 * tables.
 *
 * `preferredName` is stored here (not in `auth.users`) because Supabase
 * re-merges OAuth provider data on every sign-in, which would overwrite any
 * preferred name stored in `raw_user_meta_data`. A `custom_access_token` hook
 * (see `supabase/hooks/custom_access_token.sql`) injects `preferredName` into
 * the OIDC `name` claim so OAuth clients always see the up-to-date value.
 *
 * Email is read directly from `auth.users.email`.
 */
export const profiles = pgTable("profile", (d) => ({
  userId: d
    .uuid()
    .primaryKey()
    .references(() => authUsers.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),
  preferredName: d.varchar({ length: 255 }).notNull(),
  showGithub: d.boolean().notNull().default(false),
  showDiscord: d.boolean().notNull().default(false),
  viewedSettings: d.boolean().notNull().default(false),
  // Supabase OAuth server client ID — assigned by Supabase when the client is
  // created via the admin API. The secret is never stored here; it is returned
  // once by the admin API and shown to the user immediately.
  oauthClientId: d.varchar({ length: 255 }).unique(),
}));

export const profileLinks = pgTable("profile_link", (d) => ({
  id: d.uuid().primaryKey().defaultRandom(),
  userId: d
    .uuid("user_id")
    .notNull()
    .references(() => profiles.userId, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),
  url: d.text().notNull(),
  title: d.varchar({ length: 64 }).notNull(),
  createdAt: d.timestamp().defaultNow(),
}));

/**
 * One row per GitHub contributor to the DevDogs organisation.
 * Populated and updated by `syncLeaderboard`. The primary key is the GitHub
 * numeric user ID stored as `varchar` so it can be joined directly against
 * `auth.identities.provider_user_id` without a cast.
 */
export const leaderboardProfiles = pgTable(
  "leaderboard_profile",
  (d) => ({
    githubId: d.varchar({ length: 255 }).primaryKey(),
    githubLogin: d.varchar({ length: 255 }).unique().notNull(),
    avatarUrl: d.text(),
    allTimePoints: d.integer().notNull().default(0),
    allTimeRanking: d.integer(),
    currentYearPoints: d.integer().notNull().default(0),
    currentYearRanking: d.integer(),
  }),
  (t) => [uniqueIndex("login_idx").on(lower(t.githubLogin))],
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
  (t) => [primaryKey({ columns: [t.leaderboardProfileId, t.year] })],
);
