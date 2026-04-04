import { defineRelations } from "drizzle-orm";
import * as tables from "./tables";

const relations = defineRelations(tables, (r) => ({
  authUsers: {
    publicProfile: r.one.publicProfiles({
      from: r.authUsers.id,
      to: r.publicProfiles.userId,
      optional: false,
    }),
    onboarding: r.one.onboarding({
      from: r.authUsers.id,
      to: r.onboarding.userId,
      optional: false,
    }),
    identities: r.many.authIdentities({
      from: r.authUsers.id,
      to: r.authIdentities.userId,
    }),
    githubIdentity: r.one.authIdentities({
      from: r.authUsers.id,
      to: r.authIdentities.userId,
      where: { provider: "github" },
    }),
    discordIdentity: r.one.authIdentities({
      from: r.authUsers.id,
      to: r.authIdentities.userId,
      where: { provider: "discord" },
    }),
    leaderboardProfile: r.one.leaderboardProfiles({
      from: r.authUsers.id.through(r.authIdentities.userId),
      to: r.leaderboardProfiles.githubId.through(
        r.authIdentities.providerUserId,
      ),
    }),
  },
  authIdentities: {
    user: r.one.authUsers({
      from: r.authIdentities.userId,
      to: r.authUsers.id,
      optional: false,
    }),
  },
  publicProfiles: {
    authUser: r.one.authUsers({
      from: r.publicProfiles.userId,
      to: r.authUsers.id,
      optional: false,
    }),
  },
  onboarding: {
    authUser: r.one.authUsers({
      from: r.onboarding.userId,
      to: r.authUsers.id,
      optional: false,
    }),
  },
  leaderboardProfiles: {
    points: r.many.points({
      from: r.leaderboardProfiles.githubId,
      to: r.points.leaderboardProfileId,
    }),
  },
}));

export default relations;
