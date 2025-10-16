"use server";

import { headers } from "next/headers";
import { notFound } from "next/navigation";
import * as z from "zod";
import { env } from "~/env";
import { authenticate } from "../auth";

const callbackPathSchema = z.string().transform((path, ctx) => {
  try {
    const url = new URL(String(path), env.BASE_URL);
    return url.toString().replace(url.origin, "");
  } catch {
    ctx.addIssue({
      code: "custom",
      message: "Provided string should be a path.",
      input: path,
    });
    return z.NEVER;
  }
});

const realmSchema = z.literal(["google", "discord", "github"]);

export default async function signIn(formData: FormData) {
  const realm = await realmSchema
    .parseAsync(formData.get("realm"))
    .catch(() => "google" as const);
    
  const callbackPath = await callbackPathSchema
    .parseAsync(formData.get("callbackPath"))
    .catch(() =>
      headers().then((h) => callbackPathSchema.parseAsync(h.get("referer"))),
    )
    .catch(() => undefined);

  await authenticate(realm, callbackPath);

  console.error("Redirect failed.");
  notFound();
}
