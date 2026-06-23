export type ReportReason =
  | "spam"
  | "harassment"
  | "inappropriate_content"
  | "impersonation"
  | "other";
export type ReportStatus = "pending" | "resolved" | "dismissed";
export type SubjectAction = "warn" | "suspend" | "ban" | "no_action";
export type FilerAction = "warn" | "suspend" | "no_action";
export type ContentAction = "quarantine" | "no_action";
export interface SubmitReportParams {
  /** UUID of the user filing the report (must be a user of this client). */
  reporterUserId: string;
  /** UUID of the user being reported. */
  reportedUserId: string;
  /** Client-defined identifier for the reported content (e.g. "post_abc123"). */
  contentId: string;
  /** Optional human-readable label for the content type (e.g. "post", "comment"). */
  contentType?: string;
  /**
   * Verbatim snapshot of the content at report time. DevDogs stores this
   * immutably so moderators can review the original even if the content changes.
   * Max 5000 characters.
   */
  contentSnapshot: string;
  /** HTTPS URL where moderators can view the live content. Optional. */
  contentUrl?: string;
  /** Category of the report. */
  reason: ReportReason;
  /** Reporter's free-text note, forwarded verbatim. Max 1000 characters. */
  description?: string;
}
export interface SubmitReportResult {
  reportId: string;
  /**
   * True when this submission was recorded as corroboration of an existing
   * pending report for the same content (different reporter). False when a new
   * root report was created (or when the same reporter resubmitted idempotently).
   */
  corroborated: boolean;
}
export interface ReportResolution {
  subjectAction: SubjectAction;
  filerAction: FilerAction;
  contentAction: ContentAction;
  /** ISO 8601 timestamp of when the resolution was created. */
  createdAt: string;
}
export interface ReportStatus_ {
  id: string;
  status: ReportStatus;
  /** ISO 8601 timestamp of when the report was filed. */
  createdAt: string;
  contentId: string;
  contentType: string | null;
  /** Number of additional reporters who corroborated this report. */
  corroborationCount: number;
  /**
   * Present once the report has been resolved or dismissed.
   * `moderatorNote` is intentionally omitted from the client response.
   */
  resolution: ReportResolution | null;
}
export interface UserStanding {
  /** "banned" is sourced from Supabase's native `banned_until` mechanism. */
  role: "member" | "suspended" | "banned";
  /** Client-visible reason string, if the moderator provided one. */
  reason: string | null;
}
export interface WebhookPayload {
  event: "report.resolved";
  reportId: string;
  reportedUserId: string;
  reporterUserId: string;
  contentId: string;
  contentType: string | null;
  subjectAction: SubjectAction;
  filerAction: FilerAction;
  contentAction: ContentAction;
  /** ISO 8601 timestamp of when the report was resolved. */
  resolvedAt: string;
}
