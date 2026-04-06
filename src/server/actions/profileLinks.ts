"use server";

import { and, count, eq } from "drizzle-orm";
import ogs from "open-graph-scraper";
import * as z from "zod";
import * as zfd from "zod-form-data";
import { authenticate, expectSession } from "../auth";
import { db } from "../db";
import { profileLinks } from "../db/schema/tables";

export type ProfileLinksState = {
  links: (typeof profileLinks.$inferSelect)[];
  error?: string;
};

async function fetchLinkMetadata(
  url: string,
): Promise<{ title: string | null }> {
  try {
    const { result } = await ogs({ url, timeout: 5000 });
    return { title: result.ogTitle ?? result.dcTitle ?? null };
  } catch {
    return { title: null };
  }
}

const addLinkSchema = z.object({
  intent: zfd.text(z.literal("add-link")),
  url: zfd.text(z.url()),
});

const removeLinkSchema = z.object({
  intent: zfd.text(z.literal("remove-link")),
  id: zfd.text(z.uuid()),
});

const updateTitleSchema = z.object({
  intent: zfd.text(z.literal("update-title")),
  id: zfd.text(z.uuid()),
  title: zfd.text(z.string().min(1).max(64)),
});

const profileLinkUpdateSchema = zfd.formData(
  z.union([
    addLinkSchema,
    removeLinkSchema,
    updateTitleSchema,
  ]),
);

export default async function profileLinksAction(
  prev: ProfileLinksState,
  formData: FormData,
) {
  const userId = await expectSession().catch(() =>
    authenticate("google", "/settings/profile"),
  );

  const data = await profileLinkUpdateSchema.parseAsync(formData);

  switch (data.intent) {
    case "add-link": {
      const { protocol, hostname } = new URL(data.url);

      if (protocol !== "http:" && protocol !== "https:") {
        return {
          ...prev,
          error: "Only http and https URLs are supported.",
        } satisfies ProfileLinksState;
      }

      return await db.transaction(async (tx) => {
        const countResult = await tx
          .select({ linkCount: count() })
          .from(profileLinks)
          .where(eq(profileLinks.userId, userId));

        const linkCount = countResult[0]?.linkCount ?? 0;

        if (linkCount >= 5) {
          return { ...prev, error: "You can only add up to 5 links." };
        }

        const { title } = await fetchLinkMetadata(data.url);

        const [inserted] = await tx
          .insert(profileLinks)
          .values({
            userId,
            url: data.url,
            title:
              title ??
              hostname.substring(0, 1).toUpperCase() + hostname.substring(1),
          })
          .returning();

        if (!inserted) {
          return {
            ...prev,
            error: "Failed to save link.",
          } satisfies ProfileLinksState;
        }

        return {
          links: [...prev.links, inserted],
          error: undefined,
        } satisfies ProfileLinksState;
      });
    }

    case "remove-link": {
      await db
        .delete(profileLinks)
        .where(
          and(eq(profileLinks.id, data.id), eq(profileLinks.userId, userId)),
        );

      return {
        links: prev.links.filter((l) => l.id !== data.id),
        error: undefined,
      } satisfies ProfileLinksState;
    }

    case "update-title": {
      await db
        .update(profileLinks)
        .set({ title: data.title })
        .where(
          and(eq(profileLinks.id, data.id), eq(profileLinks.userId, userId)),
        );

      return {
        links: prev.links.map((l) =>
          l.id === data.id ? { ...l, title: data.title } : l,
        ),
        error: undefined,
      } satisfies ProfileLinksState;
    }
  }
}
