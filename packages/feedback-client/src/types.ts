export type FeedbackType =
  | "bug_report"
  | "feature_request"
  | "design_feedback"
  | "performance"
  | "content_issue"
  | "other";

export type FeedbackSeverity = "low" | "medium" | "high";

/** Browser/device context collected at submission time, for debugging. */
export interface BrowserMetadata {
  userAgent: string;
  platform: string;
  screenWidth: number;
  screenHeight: number;
  viewportWidth: number;
  viewportHeight: number;
  url: string;
}

export interface SubmitFeedbackParams {
  /** Category of the feedback. */
  type: FeedbackType;
  /**
   * Topic, as registered for this client on the DevDogs Feedback API test
   * page (`/tools/testing/feedback`). Must exactly match a registered topic
   * label.
   */
  topic: string;
  /** Optional severity. */
  severity?: FeedbackSeverity;
  /** Short summary. Max 100 characters. */
  title: string;
  /** Full description. 10-2000 characters. */
  description: string;
  /** Optional browser/device context, for debugging. */
  browserMetadata?: BrowserMetadata;
}

export interface SubmitFeedbackResult {
  feedbackId: string;
}

export interface GetTopicsResult {
  /** Topic labels registered for this client, in creation order. */
  topics: string[];
}
