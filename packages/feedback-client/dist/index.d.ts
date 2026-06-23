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
export declare class FeedbackClient {
  private readonly baseUrl;
  private readonly clientId;
  constructor({ baseUrl, clientId }: FeedbackClientOptions);
  /**
   * Submits feedback on behalf of a signed-in end user.
   *
   * @param accessToken The end user's own Supabase access token (short-lived,
   * one per signed-in user — unlike `clientId`, this is not static).
   * @param params The feedback to submit.
   * @throws When the API returns a non-2xx status (invalid token, unknown
   * topic, rate limit, etc.)
   */
  submitFeedback(
    accessToken: string,
    params: SubmitFeedbackParams,
  ): Promise<SubmitFeedbackResult>;
  /**
   * Fetches the feedback topics registered for this client. Public — no
   * access token required.
   *
   * @throws When the API returns a non-2xx status (unknown client, etc.)
   */
  getTopics(): Promise<GetTopicsResult>;
}
