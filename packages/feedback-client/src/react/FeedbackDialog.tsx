"use client";

import * as Dialog from "@radix-ui/react-dialog";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
} from "react";
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

const TYPE_OPTIONS: { value: FeedbackType; label: string }[] = [
  { value: "bug_report", label: "Bug Report" },
  { value: "feature_request", label: "Feature Request" },
  { value: "design_feedback", label: "Design Feedback" },
  { value: "performance", label: "Performance Issue" },
  { value: "content_issue", label: "Content Issue" },
  { value: "other", label: "Other" },
];

const SEVERITY_OPTIONS: { value: FeedbackSeverity; label: string }[] = [
  { value: "low", label: "Low — minor inconvenience" },
  { value: "medium", label: "Medium — impairs a feature" },
  { value: "high", label: "High — blocks core functionality" },
];

const THEME_VAR_NAMES: Record<keyof FeedbackDialogTheme, string> = {
  accent: "--fd-accent",
  accentForeground: "--fd-accent-foreground",
  background: "--fd-background",
  foreground: "--fd-foreground",
  muted: "--fd-muted",
  border: "--fd-border",
  radius: "--fd-radius",
  fontFamily: "--fd-font-family",
};

function themeToStyle(
  theme: Partial<FeedbackDialogTheme> | undefined,
): CSSProperties {
  if (!theme) return {};
  const style: Record<string, string> = {};
  for (const [key, value] of Object.entries(theme)) {
    if (value === undefined) continue;
    style[THEME_VAR_NAMES[key as keyof FeedbackDialogTheme]] = value;
  }
  return style as CSSProperties;
}

function collectMetadata(): BrowserMetadata {
  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    screenWidth: screen.width,
    screenHeight: screen.height,
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
    url: window.location.href,
  };
}

export default function FeedbackDialog({
  open,
  onOpenChange,
  title = "Submit Feedback",
  topics,
  client,
  getAccessToken,
  onSubmit,
  collectBrowserMetadata = true,
  theme,
  classNames = {},
}: FeedbackDialogProps) {
  const formRef = useRef<HTMLFormElement>(null);

  const [type, setType] = useState<FeedbackType | "">("");
  const [topic, setTopic] = useState("");
  const [severity, setSeverity] = useState<FeedbackSeverity | "">("");
  const [typeError, setTypeError] = useState(false);
  const [topicError, setTopicError] = useState(false);

  const [fetchedTopics, setFetchedTopics] = useState<string[] | null>(null);
  const [topicsLoading, setTopicsLoading] = useState(false);
  const [topicsLoadError, setTopicsLoadError] = useState<string | null>(null);

  const [isPending, setIsPending] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const resolvedTopics = topics ?? fetchedTopics ?? [];

  useEffect(() => {
    if (!open || topics) return;

    if (!client) {
      setTopicsLoadError(
        "No `topics` provided and no `client` configured to fetch them.",
      );
      return;
    }

    let cancelled = false;
    setTopicsLoading(true);
    setTopicsLoadError(null);

    client
      .getTopics()
      .then((res) => {
        if (!cancelled) setFetchedTopics(res.topics);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setTopicsLoadError(
            err instanceof Error ? err.message : "Failed to load topics.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setTopicsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, topics, client]);

  const reset = useCallback(() => {
    setType("");
    setTopic("");
    setSeverity("");
    setTypeError(false);
    setTopicError(false);
    setSubmitError(null);
    setSuccess(false);
    formRef.current?.reset();
  }, []);

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (isPending) return;
      if (!next) reset();
      onOpenChange(next);
    },
    [isPending, reset, onOpenChange],
  );

  const handleSubmit = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      let valid = true;
      if (!type) {
        setTypeError(true);
        valid = false;
      }
      if (!topic) {
        setTopicError(true);
        valid = false;
      }
      if (!valid) return;

      const formData = new FormData(e.currentTarget);
      const values: FeedbackFormValues = {
        type: type as FeedbackType,
        topic,
        severity: type === "bug_report" && severity ? severity : undefined,
        title: String(formData.get("title") ?? ""),
        description: String(formData.get("description") ?? ""),
        browserMetadata: collectBrowserMetadata ? collectMetadata() : undefined,
      };

      setSubmitError(null);
      setIsPending(true);

      void (async () => {
        try {
          if (onSubmit) {
            await onSubmit(values);
          } else {
            if (!client || !getAccessToken) {
              throw new Error(
                "Provide either `onSubmit`, or both `client` and `getAccessToken`.",
              );
            }
            await client.submitFeedback(await getAccessToken(), values);
          }
          setSuccess(true);
          setTimeout(() => {
            reset();
            onOpenChange(false);
          }, 1500);
        } catch (err) {
          setSubmitError(
            err instanceof Error ? err.message : "Failed to submit feedback.",
          );
        } finally {
          setIsPending(false);
        }
      })();
    },
    [
      type,
      topic,
      severity,
      collectBrowserMetadata,
      onSubmit,
      client,
      getAccessToken,
      reset,
      onOpenChange,
    ],
  );

  const cn = (part: FeedbackDialogPart, base: string) =>
    classNames[part] ? `${base} ${classNames[part]}` : base;

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <div className="feedback-dialog" style={themeToStyle(theme)}>
          <Dialog.Overlay
            className={cn("overlay", "feedback-dialog__overlay")}
          />
          <Dialog.Content
            className={cn("content", "feedback-dialog__content")}
            onInteractOutside={(e) => isPending && e.preventDefault()}
            onEscapeKeyDown={(e) => isPending && e.preventDefault()}
          >
            <div className={cn("header", "feedback-dialog__header")}>
              <Dialog.Title className={cn("title", "feedback-dialog__title")}>
                {title}
              </Dialog.Title>
              <Dialog.Close
                className={cn("closeButton", "feedback-dialog__close")}
                disabled={isPending}
                aria-label="Close"
              >
                ×
              </Dialog.Close>
            </div>

            {success ? (
              <div className={cn("success", "feedback-dialog__success")}>
                Thanks for the feedback!
              </div>
            ) : (
              <form
                ref={formRef}
                onSubmit={handleSubmit}
                className={cn("body", "feedback-dialog__body")}
              >
                {/* Type */}
                <div className={cn("field", "feedback-dialog__field")}>
                  <label className={cn("label", "feedback-dialog__label")}>
                    Type <span className="feedback-dialog__required">*</span>
                  </label>
                  <select
                    className={cn("select", "feedback-dialog__select")}
                    value={type}
                    onChange={(e) => {
                      setType(e.target.value as FeedbackType);
                      setTypeError(false);
                    }}
                  >
                    <option value="" disabled>
                      Select a type…
                    </option>
                    {TYPE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                  {typeError && (
                    <p className={cn("error", "feedback-dialog__error")}>
                      Please select a type.
                    </p>
                  )}
                </div>

                {/* Topic */}
                <div className={cn("field", "feedback-dialog__field")}>
                  <label className={cn("label", "feedback-dialog__label")}>
                    Area <span className="feedback-dialog__required">*</span>
                  </label>
                  <select
                    className={cn("select", "feedback-dialog__select")}
                    value={topic}
                    disabled={topicsLoading}
                    onChange={(e) => {
                      setTopic(e.target.value);
                      setTopicError(false);
                    }}
                  >
                    <option value="" disabled>
                      {topicsLoading ? "Loading…" : "Select an area…"}
                    </option>
                    {resolvedTopics.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  {topicError && (
                    <p className={cn("error", "feedback-dialog__error")}>
                      Please select an area.
                    </p>
                  )}
                  {topicsLoadError && (
                    <p className={cn("error", "feedback-dialog__error")}>
                      {topicsLoadError}
                    </p>
                  )}
                </div>

                {/* Severity (bug reports only) */}
                {type === "bug_report" && (
                  <div className={cn("field", "feedback-dialog__field")}>
                    <label className={cn("label", "feedback-dialog__label")}>
                      Severity
                    </label>
                    <select
                      className={cn("select", "feedback-dialog__select")}
                      value={severity}
                      onChange={(e) =>
                        setSeverity(e.target.value as FeedbackSeverity | "")
                      }
                    >
                      <option value="">Select severity…</option>
                      {SEVERITY_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Title */}
                <div className={cn("field", "feedback-dialog__field")}>
                  <label className={cn("label", "feedback-dialog__label")}>
                    Title <span className="feedback-dialog__required">*</span>
                  </label>
                  <input
                    className={cn("input", "feedback-dialog__input")}
                    name="title"
                    type="text"
                    placeholder="Brief summary of the issue or suggestion"
                    maxLength={100}
                    required
                  />
                </div>

                {/* Description */}
                <div className={cn("field", "feedback-dialog__field")}>
                  <label className={cn("label", "feedback-dialog__label")}>
                    Description{" "}
                    <span className="feedback-dialog__required">*</span>
                  </label>
                  <textarea
                    className={cn("textarea", "feedback-dialog__textarea")}
                    name="description"
                    rows={4}
                    placeholder="Describe the issue or suggestion in detail. Include steps to reproduce if reporting a bug."
                    minLength={10}
                    required
                  />
                </div>

                {submitError && (
                  <p className={cn("banner", "feedback-dialog__banner")}>
                    {submitError}
                  </p>
                )}

                <div className={cn("footer", "feedback-dialog__footer")}>
                  <Dialog.Close
                    type="button"
                    className={cn("cancelButton", "feedback-dialog__cancel")}
                    disabled={isPending}
                  >
                    Cancel
                  </Dialog.Close>
                  <button
                    type="submit"
                    className={cn("submitButton", "feedback-dialog__submit")}
                    disabled={isPending}
                  >
                    {isPending ? "Submitting…" : "Submit Feedback"}
                  </button>
                </div>
              </form>
            )}
          </Dialog.Content>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
