import { defineRelations } from "drizzle-orm";
import * as schema from "./schema";
import * as supabase from "~/supabase/drizzle/schema";

export const relations = defineRelations({ ...supabase, ...schema }, (r) => ({
  usersInAuth: {
    profile: r.one.profiles({
      from: r.usersInAuth.id,
      to: r.profiles.userId,
      optional: false,
    }),
    identities: r.many.identitiesInAuth({
      from: r.usersInAuth.id,
      to: r.identitiesInAuth.userId,
    }),
    githubIdentity: r.one.identitiesInAuth({
      from: r.usersInAuth.id,
      to: r.identitiesInAuth.userId,
      where: { provider: "github" },
    }),
    discordIdentity: r.one.identitiesInAuth({
      from: r.usersInAuth.id,
      to: r.identitiesInAuth.userId,
      where: { provider: "discord" },
    }),
    leaderboardProfile: r.one.leaderboardProfiles({
      from: r.usersInAuth.id.through(r.identitiesInAuth.userId),
      to: r.leaderboardProfiles.githubId.through(r.identitiesInAuth.providerId),
    }),
    testAccounts: r.many.oauthTestAccounts({
      from: r.usersInAuth.id,
      to: r.oauthTestAccounts.ownerUserId,
    }),
    oauthRegistration: r.one.oauthRegistrations({
      from: r.usersInAuth.id,
      to: r.oauthRegistrations.userId,
    }),
  },
  identitiesInAuth: {
    user: r.one.usersInAuth({
      from: r.identitiesInAuth.userId,
      to: r.usersInAuth.id,
      optional: false,
    }),
  },
  profiles: {
    authUser: r.one.usersInAuth({
      from: r.profiles.userId,
      to: r.usersInAuth.id,
      optional: false,
    }),
    links: r.many.profileLinks({
      from: r.profiles.userId,
      to: r.profileLinks.userId,
    }),
    oauthRegistration: r.one.oauthRegistrations({
      from: r.profiles.userId,
      to: r.oauthRegistrations.userId,
      optional: true,
    }),
  },
  profileLinks: {
    profile: r.one.profiles({
      from: r.profileLinks.userId,
      to: r.profiles.userId,
      optional: false,
    }),
  },
  oauthRegistrations: {
    profile: r.one.profiles({
      from: r.oauthRegistrations.userId,
      to: r.profiles.userId,
      optional: false,
    }),
    authorizations: r.many.oauthAuthorizationsInAuth({
      from: r.oauthRegistrations.clientId,
      to: r.oauthAuthorizationsInAuth.clientId,
    }),
  },
  oauthTestAccounts: {
    user: r.one.usersInAuth({
      from: r.oauthTestAccounts.testUserId,
      to: r.usersInAuth.id,
      optional: false,
    }),
  },
  leaderboardProfiles: {
    points: r.many.points({
      from: r.leaderboardProfiles.githubId,
      to: r.points.leaderboardProfileId,
    }),
  },
  oauthAuthorizationsInAuth: {
    oauthRegistrations: r.one.oauthRegistrations({
      from: r.oauthAuthorizationsInAuth.clientId,
      to: r.oauthRegistrations.clientId,
      optional: false,
    }),
  },
}));
