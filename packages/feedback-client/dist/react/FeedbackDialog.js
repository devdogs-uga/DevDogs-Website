"use client";
"use strict";
var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        var desc = Object.getOwnPropertyDescriptor(m, k);
        if (
          !desc ||
          ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)
        ) {
          desc = {
            enumerable: true,
            get: function () {
              return m[k];
            },
          };
        }
        Object.defineProperty(o, k2, desc);
      }
    : function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        o[k2] = m[k];
      });
var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? function (o, v) {
        Object.defineProperty(o, "default", { enumerable: true, value: v });
      }
    : function (o, v) {
        o["default"] = v;
      });
var __importStar =
  (this && this.__importStar) ||
  (function () {
    var ownKeys = function (o) {
      ownKeys =
        Object.getOwnPropertyNames ||
        function (o) {
          var ar = [];
          for (var k in o)
            if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
          return ar;
        };
      return ownKeys(o);
    };
    return function (mod) {
      if (mod && mod.__esModule) return mod;
      var result = {};
      if (mod != null)
        for (var k = ownKeys(mod), i = 0; i < k.length; i++)
          if (k[i] !== "default") __createBinding(result, mod, k[i]);
      __setModuleDefault(result, mod);
      return result;
    };
  })();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = FeedbackDialog;
const jsx_runtime_1 = require("react/jsx-runtime");
const Dialog = __importStar(require("@radix-ui/react-dialog"));
const react_1 = require("react");
const TYPE_OPTIONS = [
  { value: "bug_report", label: "Bug Report" },
  { value: "feature_request", label: "Feature Request" },
  { value: "design_feedback", label: "Design Feedback" },
  { value: "performance", label: "Performance Issue" },
  { value: "content_issue", label: "Content Issue" },
  { value: "other", label: "Other" },
];
const SEVERITY_OPTIONS = [
  { value: "low", label: "Low — minor inconvenience" },
  { value: "medium", label: "Medium — impairs a feature" },
  { value: "high", label: "High — blocks core functionality" },
];
const THEME_VAR_NAMES = {
  accent: "--fd-accent",
  accentForeground: "--fd-accent-foreground",
  background: "--fd-background",
  foreground: "--fd-foreground",
  muted: "--fd-muted",
  border: "--fd-border",
  radius: "--fd-radius",
  fontFamily: "--fd-font-family",
};
function themeToStyle(theme) {
  if (!theme) return {};
  const style = {};
  for (const [key, value] of Object.entries(theme)) {
    if (value === undefined) continue;
    style[THEME_VAR_NAMES[key]] = value;
  }
  return style;
}
function collectMetadata() {
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
function FeedbackDialog({
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
}) {
  const formRef = (0, react_1.useRef)(null);
  const [type, setType] = (0, react_1.useState)("");
  const [topic, setTopic] = (0, react_1.useState)("");
  const [severity, setSeverity] = (0, react_1.useState)("");
  const [typeError, setTypeError] = (0, react_1.useState)(false);
  const [topicError, setTopicError] = (0, react_1.useState)(false);
  const [fetchedTopics, setFetchedTopics] = (0, react_1.useState)(null);
  const [topicsLoading, setTopicsLoading] = (0, react_1.useState)(false);
  const [topicsLoadError, setTopicsLoadError] = (0, react_1.useState)(null);
  const [isPending, setIsPending] = (0, react_1.useState)(false);
  const [submitError, setSubmitError] = (0, react_1.useState)(null);
  const [success, setSuccess] = (0, react_1.useState)(false);
  const resolvedTopics = topics ?? fetchedTopics ?? [];
  (0, react_1.useEffect)(() => {
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
      .catch((err) => {
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
  const reset = (0, react_1.useCallback)(() => {
    setType("");
    setTopic("");
    setSeverity("");
    setTypeError(false);
    setTopicError(false);
    setSubmitError(null);
    setSuccess(false);
    formRef.current?.reset();
  }, []);
  const handleOpenChange = (0, react_1.useCallback)(
    (next) => {
      if (isPending) return;
      if (!next) reset();
      onOpenChange(next);
    },
    [isPending, reset, onOpenChange],
  );
  const handleSubmit = (0, react_1.useCallback)(
    (e) => {
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
      const values = {
        type: type,
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
  const cn = (part, base) =>
    classNames[part] ? `${base} ${classNames[part]}` : base;
  return (0, jsx_runtime_1.jsx)(Dialog.Root, {
    open: open,
    onOpenChange: handleOpenChange,
    children: (0, jsx_runtime_1.jsx)(Dialog.Portal, {
      children: (0, jsx_runtime_1.jsxs)("div", {
        className: "feedback-dialog",
        style: themeToStyle(theme),
        children: [
          (0, jsx_runtime_1.jsx)(Dialog.Overlay, {
            className: cn("overlay", "feedback-dialog__overlay"),
          }),
          (0, jsx_runtime_1.jsxs)(Dialog.Content, {
            className: cn("content", "feedback-dialog__content"),
            onInteractOutside: (e) => isPending && e.preventDefault(),
            onEscapeKeyDown: (e) => isPending && e.preventDefault(),
            children: [
              (0, jsx_runtime_1.jsxs)("div", {
                className: cn("header", "feedback-dialog__header"),
                children: [
                  (0, jsx_runtime_1.jsx)(Dialog.Title, {
                    className: cn("title", "feedback-dialog__title"),
                    children: title,
                  }),
                  (0, jsx_runtime_1.jsx)(Dialog.Close, {
                    className: cn("closeButton", "feedback-dialog__close"),
                    disabled: isPending,
                    "aria-label": "Close",
                    children: "\u00D7",
                  }),
                ],
              }),
              success
                ? (0, jsx_runtime_1.jsx)("div", {
                    className: cn("success", "feedback-dialog__success"),
                    children: "Thanks for the feedback!",
                  })
                : (0, jsx_runtime_1.jsxs)("form", {
                    ref: formRef,
                    onSubmit: handleSubmit,
                    className: cn("body", "feedback-dialog__body"),
                    children: [
                      (0, jsx_runtime_1.jsxs)("div", {
                        className: cn("field", "feedback-dialog__field"),
                        children: [
                          (0, jsx_runtime_1.jsxs)("label", {
                            className: cn("label", "feedback-dialog__label"),
                            children: [
                              "Type",
                              " ",
                              (0, jsx_runtime_1.jsx)("span", {
                                className: "feedback-dialog__required",
                                children: "*",
                              }),
                            ],
                          }),
                          (0, jsx_runtime_1.jsxs)("select", {
                            className: cn("select", "feedback-dialog__select"),
                            value: type,
                            onChange: (e) => {
                              setType(e.target.value);
                              setTypeError(false);
                            },
                            children: [
                              (0, jsx_runtime_1.jsx)("option", {
                                value: "",
                                disabled: true,
                                children: "Select a type\u2026",
                              }),
                              TYPE_OPTIONS.map((o) =>
                                (0, jsx_runtime_1.jsx)(
                                  "option",
                                  { value: o.value, children: o.label },
                                  o.value,
                                ),
                              ),
                            ],
                          }),
                          typeError &&
                            (0, jsx_runtime_1.jsx)("p", {
                              className: cn("error", "feedback-dialog__error"),
                              children: "Please select a type.",
                            }),
                        ],
                      }),
                      (0, jsx_runtime_1.jsxs)("div", {
                        className: cn("field", "feedback-dialog__field"),
                        children: [
                          (0, jsx_runtime_1.jsxs)("label", {
                            className: cn("label", "feedback-dialog__label"),
                            children: [
                              "Area ",
                              (0, jsx_runtime_1.jsx)("span", {
                                className: "feedback-dialog__required",
                                children: "*",
                              }),
                            ],
                          }),
                          (0, jsx_runtime_1.jsxs)("select", {
                            className: cn("select", "feedback-dialog__select"),
                            value: topic,
                            disabled: topicsLoading,
                            onChange: (e) => {
                              setTopic(e.target.value);
                              setTopicError(false);
                            },
                            children: [
                              (0, jsx_runtime_1.jsx)("option", {
                                value: "",
                                disabled: true,
                                children: topicsLoading
                                  ? "Loading…"
                                  : "Select an area…",
                              }),
                              resolvedTopics.map((t) =>
                                (0, jsx_runtime_1.jsx)(
                                  "option",
                                  { value: t, children: t },
                                  t,
                                ),
                              ),
                            ],
                          }),
                          topicError &&
                            (0, jsx_runtime_1.jsx)("p", {
                              className: cn("error", "feedback-dialog__error"),
                              children: "Please select an area.",
                            }),
                          topicsLoadError &&
                            (0, jsx_runtime_1.jsx)("p", {
                              className: cn("error", "feedback-dialog__error"),
                              children: topicsLoadError,
                            }),
                        ],
                      }),
                      type === "bug_report" &&
                        (0, jsx_runtime_1.jsxs)("div", {
                          className: cn("field", "feedback-dialog__field"),
                          children: [
                            (0, jsx_runtime_1.jsx)("label", {
                              className: cn("label", "feedback-dialog__label"),
                              children: "Severity",
                            }),
                            (0, jsx_runtime_1.jsxs)("select", {
                              className: cn(
                                "select",
                                "feedback-dialog__select",
                              ),
                              value: severity,
                              onChange: (e) => setSeverity(e.target.value),
                              children: [
                                (0, jsx_runtime_1.jsx)("option", {
                                  value: "",
                                  children: "Select severity\u2026",
                                }),
                                SEVERITY_OPTIONS.map((o) =>
                                  (0, jsx_runtime_1.jsx)(
                                    "option",
                                    { value: o.value, children: o.label },
                                    o.value,
                                  ),
                                ),
                              ],
                            }),
                          ],
                        }),
                      (0, jsx_runtime_1.jsxs)("div", {
                        className: cn("field", "feedback-dialog__field"),
                        children: [
                          (0, jsx_runtime_1.jsxs)("label", {
                            className: cn("label", "feedback-dialog__label"),
                            children: [
                              "Title ",
                              (0, jsx_runtime_1.jsx)("span", {
                                className: "feedback-dialog__required",
                                children: "*",
                              }),
                            ],
                          }),
                          (0, jsx_runtime_1.jsx)("input", {
                            className: cn("input", "feedback-dialog__input"),
                            name: "title",
                            type: "text",
                            placeholder:
                              "Brief summary of the issue or suggestion",
                            maxLength: 100,
                            required: true,
                          }),
                        ],
                      }),
                      (0, jsx_runtime_1.jsxs)("div", {
                        className: cn("field", "feedback-dialog__field"),
                        children: [
                          (0, jsx_runtime_1.jsxs)("label", {
                            className: cn("label", "feedback-dialog__label"),
                            children: [
                              "Description",
                              " ",
                              (0, jsx_runtime_1.jsx)("span", {
                                className: "feedback-dialog__required",
                                children: "*",
                              }),
                            ],
                          }),
                          (0, jsx_runtime_1.jsx)("textarea", {
                            className: cn(
                              "textarea",
                              "feedback-dialog__textarea",
                            ),
                            name: "description",
                            rows: 4,
                            placeholder:
                              "Describe the issue or suggestion in detail. Include steps to reproduce if reporting a bug.",
                            minLength: 10,
                            required: true,
                          }),
                        ],
                      }),
                      submitError &&
                        (0, jsx_runtime_1.jsx)("p", {
                          className: cn("banner", "feedback-dialog__banner"),
                          children: submitError,
                        }),
                      (0, jsx_runtime_1.jsxs)("div", {
                        className: cn("footer", "feedback-dialog__footer"),
                        children: [
                          (0, jsx_runtime_1.jsx)(Dialog.Close, {
                            type: "button",
                            className: cn(
                              "cancelButton",
                              "feedback-dialog__cancel",
                            ),
                            disabled: isPending,
                            children: "Cancel",
                          }),
                          (0, jsx_runtime_1.jsx)("button", {
                            type: "submit",
                            className: cn(
                              "submitButton",
                              "feedback-dialog__submit",
                            ),
                            disabled: isPending,
                            children: isPending
                              ? "Submitting…"
                              : "Submit Feedback",
                          }),
                        ],
                      }),
                    ],
                  }),
            ],
          }),
        ],
      }),
    }),
  });
}
