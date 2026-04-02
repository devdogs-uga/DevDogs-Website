import { graphql } from "@octokit/graphql";
import { addWeeks, compareAsc, isAfter, parseISO } from "date-fns";
import { sql } from "drizzle-orm";
import { env } from "~/env";
import { db } from "../db";
import { githubProfiles, points as pointsTable } from "../db/schema/tables";
import {
  type ClosedIssuesResult,
  type ProjectFields,
  ClosedIssues,
} from "./queries";

function tryParseInt(value: string | undefined) {
  if (!value) {
    return 1;
  }

  const parseResult = parseInt(value);

  if (isNaN(parseResult)) {
    return 1;
  }

  return parseResult;
}

function calculateBasePoints(fields: ProjectFields | undefined) {
  const quality = tryParseInt(fields?.quality?.name) / 3;
  const priority = tryParseInt(fields?.priority?.name) / 4;
  const complexity = tryParseInt(fields?.complexity?.name) / 3;
  return quality * (priority + complexity) * 120;
}

interface ClosedIssue {
  assignee: ClosedIssuesResult["search"]["nodes"][number]["assignees"]["nodes"][number];
  basePoints: number;
  closedAt: Date;
}

async function getClosedIssues(year: number) {
  const results: ClosedIssue[] = [];
  let cursor: string | null = null;
  let hasNextPage = true;

  while (hasNextPage) {
    const { search }: ClosedIssuesResult = await graphql(ClosedIssues, {
      cursor,
      searchQuery: `org:${env.GITHUB_ORG} type:issue closed:${year}-01-01..${year}-12-31`,
      headers: {
        authorization: `Bearer ${env.GITHUB_TOKEN}`,
      },
    });

    for (const { assignees, projectItems, closedAt } of search.nodes) {
      const basePoints =
        calculateBasePoints(projectItems.nodes[0]) / assignees.nodes.length;

      for (const assignee of assignees.nodes) {
        results.push({
          basePoints,
          assignee,
          closedAt: parseISO(closedAt),
        });
      }
    }

    cursor = search.pageInfo.endCursor;
    hasNextPage = search.pageInfo.hasNextPage;
  }

  return results;
}

async function syncYearPoints(
  profiles: Map<number, Required<typeof githubProfiles.$inferInsert>>,
  year: number,
  isCurrent: boolean,
) {
  const closedIssues = await getClosedIssues(year);
  const points = new Map<number, Required<typeof pointsTable.$inferInsert>>();

  if (closedIssues.length < 0) {
    return [];
  }

  closedIssues.sort((a, b) => compareAsc(a.closedAt, b.closedAt));

  for (const { assignee, basePoints, closedAt } of closedIssues) {
    if (!profiles.has(assignee.databaseId)) {
      profiles.set(assignee.databaseId, {
        id: assignee.databaseId,
        login: assignee.login,
        avatarUrl: assignee.avatarUrl,
        allTimePoints: 0,
        allTimeRanking: null,
        currentYearPoints: 0,
        currentYearRanking: null,
        accessTokenId: null,
      });
    }

    const pointsEntry = points.get(assignee.databaseId);
    const profile = profiles.get(assignee.databaseId)!;

    profile.allTimePoints += basePoints;

    if (isCurrent) {
      profile.currentYearPoints += basePoints;
    }

    if (!pointsEntry) {
      points.set(assignee.databaseId, {
        year,
        githubProfileId: assignee.databaseId,
        academyPoints: 0,
        streakStart: closedAt,
        streakLength: 1,
        longestStreakLength: 1,
        projectPoints: basePoints,
        streakBonusPoints: 0,
      });
      continue;
    }

    pointsEntry.projectPoints += basePoints;

    const streakRenewalStart = addWeeks(
      pointsEntry.streakStart,
      pointsEntry.streakLength,
    );

    const streakRenewalCutoff = addWeeks(
      pointsEntry.streakStart,
      pointsEntry.streakLength + 1,
    );

    if (isAfter(closedAt, streakRenewalCutoff)) {
      pointsEntry.streakStart = closedAt;
      pointsEntry.streakLength = 1;
      continue;
    }

    if (isAfter(closedAt, streakRenewalStart)) {
      pointsEntry.streakLength++;
    }

    pointsEntry.longestStreakLength = Math.max(
      pointsEntry.streakLength,
      pointsEntry.longestStreakLength,
    );

    const bonusPoints = (basePoints * pointsEntry.streakLength) / 10;
    pointsEntry.streakBonusPoints += bonusPoints;
    profile.allTimePoints += bonusPoints;

    if (isCurrent) {
      profile.currentYearPoints += bonusPoints;
    }
  }

  return Array.from(points.values());
}

export default async function syncLeaderboard() {
  const startYear = env.DEVDOGS_EPOCH.getUTCFullYear();
  const endYear = new Date().getUTCFullYear();
  const profiles = new Map<
    number,
    Required<typeof githubProfiles.$inferInsert>
  >();

  const points = await Promise.all(
    Array.from({ length: endYear - startYear + 1 }, (_, i) =>
      syncYearPoints(profiles, startYear + i, startYear + i === endYear),
    ),
  );

  const rankedProfiles = Array.from(profiles.values());

  rankedProfiles.sort((a, b) => b.currentYearPoints - a.currentYearPoints);
  rankedProfiles.forEach((profile, i) => {
    profile.currentYearRanking = i + 1;
  });

  rankedProfiles.sort((a, b) => b.allTimePoints - a.allTimePoints);
  rankedProfiles.forEach((profile, i) => {
    profile.allTimeRanking = i + 1;
  });

  await db.transaction(async (tx) => {
    await tx
      .insert(githubProfiles)
      .values(rankedProfiles)
      .onConflictDoUpdate({
        target: githubProfiles.id,
        set: {
          login: sql`excluded.login`,
          avatarUrl: sql`excluded."avatarUrl"`,
          allTimePoints: sql`excluded."allTimePoints"`,
          allTimeRanking: sql`excluded."allTimeRanking"`,
          currentYearPoints: sql`excluded."currentYearPoints"`,
          currentYearRanking: sql`excluded."currentYearRanking"`,
        },
      });

    await tx
      .insert(pointsTable)
      .values(points.flat())
      .onConflictDoUpdate({
        target: [pointsTable.githubProfileId, pointsTable.year],
        set: {
          academyPoints: sql`excluded."academyPoints"`,
          longestStreakLength: sql`excluded."longestStreakLength"`,
          projectPoints: sql`excluded."projectPoints"`,
          streakBonusPoints: sql`excluded."streakBonusPoints"`,
          streakLength: sql`excluded."streakLength"`,
          streakStart: sql`excluded."streakStart"`,
        },
      });
  });
}
