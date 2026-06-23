export type {
  ReportReason,
  ReportStatus,
  SubjectAction,
  FilerAction,
  ContentAction,
  SubmitReportParams,
  SubmitReportResult,
  ReportResolution,
  ReportStatus_ as ReportStatusResponse,
  UserStanding,
  WebhookPayload,
} from "./types.js";
import type {
  SubmitReportParams,
  SubmitReportResult,
  ReportStatus_ as ReportStatus,
  UserStanding,
} from "./types.js";
export interface ReportsClientOptions {
  /** Base URL of the DevDogs website (e.g. "https://devdogs.uga.edu"). */
  baseUrl: string;
  /**
   * Report API key in the format `<clientId>.<rawKey>`.
   * Generated on the OAuth settings page at /settings/oauth.
   */
  apiKey: string;
}
/**
 * Type-safe HTTP client for the DevDogs content-reporting API.
 *
 * All methods throw on non-2xx responses. Network errors propagate as-is.
 *
 * @example
 * ```ts
 * import { ReportsClient } from "@devdogsuga/reports-client";
 *
 * const client = new ReportsClient({
 *   baseUrl: "https://devdogs.uga.edu",
 *   apiKey: process.env.DEVDOGS_REPORT_API_KEY!,
 * });
 *
 * const { reportId } = await client.submitReport({ ... });
 * ```
 */
export declare class ReportsClient {
  private readonly baseUrl;
  private readonly authHeader;
  constructor({ baseUrl, apiKey }: ReportsClientOptions);
  private request;
  /**
   * Submits a content report server-to-server.
   *
   * If a pending report for the same `contentId` already exists (filed by a
   * different reporter), the submission is recorded as a corroboration and
   * `corroborated: true` is returned.
   *
   * @throws When the API returns a non-2xx status (auth failure, rate limit, etc.)
   */
  submitReport(params: SubmitReportParams): Promise<SubmitReportResult>;
  /**
   * Polls the status of a previously submitted report.
   *
   * Use this to check whether a report has been resolved and to retrieve the
   * moderation decision. `moderatorNote` is intentionally omitted from the
   * response.
   *
   * @param reportId The `reportId` returned by {@link submitReport}.
   */
  getReportStatus(reportId: string): Promise<ReportStatus>;
  /**
   * Returns a user's org-wide standing.
   *
   * Call this on sign-in or before allowing sensitive actions (e.g. creating a
   * post) to check whether DevDogs has suspended or banned the user.
   *
   * @param userId The Supabase `auth.uid()` of the user to check.
   */
  getUserStanding(userId: string): Promise<UserStanding>;
}
