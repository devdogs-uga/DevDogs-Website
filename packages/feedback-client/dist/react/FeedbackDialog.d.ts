import type { FeedbackClient } from "../index.js";
import type {
  BrowserMetadata,
  FeedbackSeverity,
  FeedbackType,
} from "../types.js";
import { type FeedbackDialogTheme } from "./theme.js";
export type FeedbackDialogPart =
  | "overlay"
  | "content"
  | "header"
  | "title"
  | "closeButton"
  | "body"
  | "field"
  | "label"
  | "select"
  | "input"
  | "textarea"
  | "hint"
  | "error"
  | "banner"
  | "success"
  | "footer"
  | "cancelButton"
  | "submitButton";
export interface FeedbackFormValues {
  type: FeedbackType;
  topic: string;
  severity?: FeedbackSeverity;
  title: string;
  description: string;
  browserMetadata?: BrowserMetadata;
}
export interface FeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Dialog heading. Default "Submit Feedback". */
  title?: string;
  /**
   * Fixed topic list to populate the "Area" dropdown. If omitted, topics are
   * fetched via `client.getTopics()` when the dialog opens — in that case
   * `client` is required.
   */
  topics?: string[];
  /** Used for the default submit/getTopics transport. */
  client?: FeedbackClient;
  /** Used for the default submit transport. Required unless `onSubmit` is given. */
  getAccessToken?: () => Promise<string>;
  /**
   * Overrides the default `client.submitFeedback()` transport — e.g. to
   * submit via your own server action instead of the public API.
   */
  onSubmit?: (values: FeedbackFormValues) => Promise<void>;
  /** Collect navigator/screen/window metadata and include it. Default true. */
  collectBrowserMetadata?: boolean;
  /** CSS custom-property overrides, applied as inline styles on the root. */
  theme?: Partial<FeedbackDialogTheme>;
  /** Per-part className overrides, merged with the defaults from styles.css. */
  classNames?: Partial<Record<FeedbackDialogPart, string>>;
}
export default function FeedbackDialog({
  open,
  onOpenChange,
  title,
  topics,
  client,
  getAccessToken,
  onSubmit,
  collectBrowserMetadata,
  theme,
  classNames,
}: FeedbackDialogProps): import("react").JSX.Element;
