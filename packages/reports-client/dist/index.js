"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportsClient = void 0;
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
class ReportsClient {
  baseUrl;
  authHeader;
  constructor({ baseUrl, apiKey }) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.authHeader = `Bearer ${apiKey}`;
  }
  async request(method, path, body) {
    const headers = {
      Authorization: this.authHeader,
    };
    if (body !== undefined) {
      headers["Content-Type"] = "application/json";
    }
    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => res.statusText);
      throw new Error(`DevDogs API ${method} ${path} → ${res.status}: ${text}`);
    }
    return res.json();
  }
  /**
   * Submits a content report server-to-server.
   *
   * If a pending report for the same `contentId` already exists (filed by a
   * different reporter), the submission is recorded as a corroboration and
   * `corroborated: true` is returned.
   *
   * @throws When the API returns a non-2xx status (auth failure, rate limit, etc.)
   */
  async submitReport(params) {
    const raw = await this.request("POST", "/api/reports", params);
    return { reportId: raw.reportId, corroborated: raw.corroborated ?? false };
  }
  /**
   * Polls the status of a previously submitted report.
   *
   * Use this to check whether a report has been resolved and to retrieve the
   * moderation decision. `moderatorNote` is intentionally omitted from the
   * response.
   *
   * @param reportId The `reportId` returned by {@link submitReport}.
   */
  async getReportStatus(reportId) {
    return this.request("GET", `/api/reports/${encodeURIComponent(reportId)}`);
  }
  /**
   * Returns a user's org-wide standing.
   *
   * Call this on sign-in or before allowing sensitive actions (e.g. creating a
   * post) to check whether DevDogs has suspended or banned the user.
   *
   * @param userId The Supabase `auth.uid()` of the user to check.
   */
  async getUserStanding(userId) {
    return this.request(
      "GET",
      `/api/users/${encodeURIComponent(userId)}/standing`,
    );
  }
}
exports.ReportsClient = ReportsClient;
