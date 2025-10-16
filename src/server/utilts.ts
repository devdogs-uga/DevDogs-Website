import { headers } from "next/headers";
import * as z from "zod";
import { env } from "~/env";

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

export async function getCallbackPath(
  fallback: string,
  formData?: FormData,
) {
  const referer = (await headers()).get("referer");
  return await callbackPathSchema
    .parseAsync(formData?.get("callbackPath"))
    .catch(() =>
      callbackPathSchema.parseAsync(referer).catch(() => fallback),
    );
}
