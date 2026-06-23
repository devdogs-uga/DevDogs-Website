import { createHmac, timingSafeEqual } from "node:crypto";
import type { WebhookPayload } from "./types.js";

export type { WebhookPayload } from "./types.js";

/**
 * Verifies the `X-DevDogs-Signature` header on an incoming webhook POST.
 *
 * DevDogs signs payloads with HMAC-SHA256 using your webhook signing secret.
 * The signature format matches GitHub's scheme: `sha256=<hex-digest>`.
 *
 * Always call this before trusting webhook payload data. Uses `timingSafeEqual`
 * to prevent timing attacks.
 *
 * @param body      The raw request body string (before any JSON parsing).
 * @param secret    Your webhook signing secret (the `rawHex` value shown once
 *                  on the OAuth settings page).
 * @param signature The value of the `X-DevDogs-Signature` request header.
 * @returns `true` if the signature is valid, `false` otherwise.
 *
 * @example
 * ```ts
 * import { verifyWebhookSignature, parseWebhookPayload } from "@devdogsuga/reports-client/webhook";
 *
 * // In your Next.js route handler (or any Node.js server):
 * export async function POST(request: Request) {
 *   const body = await request.text();
 *   const sig = request.headers.get("x-devdogs-signature") ?? "";
 *
 *   if (!verifyWebhookSignature(body, process.env.DEVDOGS_WEBHOOK_SECRET!, sig)) {
 *     return new Response("Invalid signature", { status: 401 });
 *   }
 *
 *   const payload = parseWebhookPayload(body);
 *   // handle payload ...
 * }
 * ```
 */
export function verifyWebhookSignature(
  body: string,
  secret: string,
  signature: string,
): boolean {
  if (!signature.startsWith("sha256=")) return false;

  const expected = `sha256=${createHmac("sha256", secret)
    .update(body)
    .digest("hex")}`;

  try {
    return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    // timingSafeEqual throws when buffers differ in length
    return false;
  }
}

/**
 * Parses a verified webhook payload body into a typed {@link WebhookPayload}.
 *
 * Call {@link verifyWebhookSignature} before this to authenticate the request.
 *
 * @param body The raw request body string.
 * @throws `SyntaxError` if `body` is not valid JSON.
 * @throws `Error` if the parsed object is missing required fields.
 */
export function parseWebhookPayload(body: string): WebhookPayload {
  const data = JSON.parse(body) as Record<string, unknown>;

  if (data.event !== "report.resolved") {
    throw new Error(`Unknown webhook event: ${String(data.event)}`);
  }

  const required = [
    "reportId",
    "reportedUserId",
    "reporterUserId",
    "contentId",
    "subjectAction",
    "filerAction",
    "contentAction",
    "resolvedAt",
  ] as const;

  for (const key of required) {
    if (typeof data[key] !== "string") {
      throw new Error(`Webhook payload missing required field: ${key}`);
    }
  }

  return data as unknown as WebhookPayload;
}
