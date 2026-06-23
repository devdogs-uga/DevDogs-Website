export type {
  FeedbackType,
  FeedbackSeverity,
  BrowserMetadata,
  SubmitFeedbackParams,
  SubmitFeedbackResult,
  GetTopicsResult,
} from "./types.js";

import type {
  GetTopicsResult,
  SubmitFeedbackParams,
  SubmitFeedbackResult,
} from "./types.js";

export interface FeedbackClientOptions {
  /** Base URL of the DevDogs website (e.g. "https://devdogs.uga.edu"). */
  baseUrl: string;
  /**
   * This app's OAuth client ID, as shown on the Feedback API test page
   * (`/tools/testing/feedback`). Public — safe to embed in client code.
   */
  clientId: string;
}

/**
 * Type-safe HTTP client for the DevDogs feedback API.
 *
 * Submit-only: there is no status polling or webhook. Feedback is reviewed
 * by DevDogs admins directly.
 *
 * @example
 * ```ts
 * import { FeedbackClient } from "@devdogsuga/feedback-client";
 *
 * const client = new FeedbackClient({
 *   baseUrl: "https://devdogs.uga.edu",
 *   clientId: process.env.DEVDOGS_CLIENT_ID!,
 * });
 *
 * const { feedbackId } = await client.submitFeedback(userAccessToken, {
 *   type: "bug_report",
 *   topic: "Search & Filtering",
 *   title: "Search results are out of order",
 *   description: "Sorting by date doesn't work when filtering by category.",
 * });
 * ```
 */
export class FeedbackClient {
  private readonly baseUrl: string;
  private readonly clientId: string;

  constructor({ baseUrl, clientId }: FeedbackClientOptions) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.clientId = clientId;
  }

  /**
   * Submits feedback on behalf of a signed-in end user.
   *
   * @param accessToken The end user's own Supabase access token (short-lived,
   * one per signed-in user — unlike `clientId`, this is not static).
   * @param params The feedback to submit.
   * @throws When the API returns a non-2xx status (invalid token, unknown
   * topic, rate limit, etc.)
   */
  async submitFeedback(
    accessToken: string,
    params: SubmitFeedbackParams,
  ): Promise<SubmitFeedbackResult> {
    const path = `/api/feedback/${encodeURIComponent(this.clientId)}`;

    const res = await fetch(`${this.baseUrl}${path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => res.statusText);
      throw new Error(`DevDogs API POST ${path} → ${res.status}: ${text}`);
    }

    return res.json() as Promise<SubmitFeedbackResult>;
  }

  /**
   * Fetches the feedback topics registered for this client. Public — no
   * access token required.
   *
   * @throws When the API returns a non-2xx status (unknown client, etc.)
   */
  async getTopics(): Promise<GetTopicsResult> {
    const path = `/api/feedback/${encodeURIComponent(this.clientId)}/topics`;

    const res = await fetch(`${this.baseUrl}${path}`);

    if (!res.ok) {
      const text = await res.text().catch(() => res.statusText);
      throw new Error(`DevDogs API GET ${path} → ${res.status}: ${text}`);
    }

    return res.json() as Promise<GetTopicsResult>;
  }
}
