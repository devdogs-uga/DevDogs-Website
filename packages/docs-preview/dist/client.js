"use strict";
/**
 * Browser-compatible client API for the @devdogsuga/docs-preview server.
 *
 * Import this module from the Next.js app (or any browser context) to
 * interact with a running preview server without manually constructing URLs
 * or parsing WebSocket messages.
 *
 * @example
 * import { fetchTree, fetchGitInfo, connectPreviewSocket } from "@devdogsuga/docs-preview/client";
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SCREAMING_SNAKE_CASE =
  exports.PREVIEW_WS_URL =
  exports.PREVIEW_URL =
  exports.PREVIEW_PORT =
    void 0;
exports.fetchTree = fetchTree;
exports.fetchGitInfo = fetchGitInfo;
exports.checkPreviewServer = checkPreviewServer;
exports.fetchFile = fetchFile;
exports.connectPreviewSocket = connectPreviewSocket;
// ── Constants ─────────────────────────────────────────────────────────────────
/** Port the docs-preview server listens on. */
exports.PREVIEW_PORT = 4987;
/** Base HTTP URL for the docs-preview server. */
exports.PREVIEW_URL = `http://localhost:${exports.PREVIEW_PORT}`;
/** WebSocket URL used for live-reload events. */
exports.PREVIEW_WS_URL = `ws://localhost:${exports.PREVIEW_PORT}/ws`;
/**
 * Regex that matches SCREAMING_SNAKE_CASE filenames (uppercase letters, digits,
 * underscores, and hyphens). Root-level markdown files whose base name matches
 * this pattern are served by the preview server as Introduction pages.
 *
 * Must stay in sync with SCREAMING_SNAKE_CASE in src/server.ts.
 */
exports.SCREAMING_SNAKE_CASE = /^[A-Z][A-Z0-9_-]*$/;
// ── HTTP helpers ──────────────────────────────────────────────────────────────
/**
 * Fetches the list of markdown files available from the preview server.
 *
 * The returned paths use two conventions:
 * - **Bare filenames** (e.g. `"README.md"`) — SCREAMING_SNAKE_CASE files at
 *   the project root (Introduction section).
 * - **`"docs/..."` paths** (e.g. `"docs/getting-started.md"`) — files under
 *   the project's `docs/` directory (Docs section).
 *
 * @throws {Error} If the server is unreachable or returns a non-OK status.
 */
async function fetchTree() {
  const res = await fetch(`${exports.PREVIEW_URL}/tree`);
  if (!res.ok) throw new Error(`/tree returned ${res.status}`);
  return res.json();
}
/**
 * Fetches the current git branch name and a human-readable description of the
 * working tree's status relative to the upstream branch.
 *
 * @throws {Error} If the server is unreachable or returns a non-OK status.
 */
async function fetchGitInfo() {
  const res = await fetch(`${exports.PREVIEW_URL}/git`);
  if (!res.ok) throw new Error(`/git returned ${res.status}`);
  return res.json();
}
/**
 * Checks whether the preview server is currently reachable.
 *
 * Unlike {@link fetchTree}, this never throws — network errors and non-OK
 * responses both resolve to `false`.
 */
async function checkPreviewServer() {
  try {
    const res = await fetch(`${exports.PREVIEW_URL}/tree`, {
      cache: "no-store",
    });
    return res.ok;
  } catch {
    return false;
  }
}
/**
 * Fetches the raw Markdown content of a single file by its path relative to
 * the project root (e.g. `"README.md"` or `"docs/getting-started.md"`).
 *
 * @returns The file's text content, or `null` if the file does not exist (404).
 * @throws {Error} On non-404 error responses or network failures.
 */
async function fetchFile(filePath) {
  const res = await fetch(
    `${exports.PREVIEW_URL}/file?path=${encodeURIComponent(filePath)}`,
  );
  if (res.status === 404) return null;
  if (!res.ok)
    throw new Error(`/file returned ${res.status} for "${filePath}"`);
  return res.text();
}
// ── WebSocket connector ───────────────────────────────────────────────────────
/**
 * Opens a WebSocket connection to the preview server and calls `onEvent`
 * whenever a watched file is added, changed, or removed. Automatically
 * reconnects after a 2-second delay when the connection is lost.
 *
 * @param onEvent - Callback invoked with each {@link ChangeEvent}.
 * @returns A cleanup function that permanently closes the connection and
 *   cancels any pending reconnect timer.
 *
 * @example
 * const disconnect = connectPreviewSocket((event) => {
 *   console.log("file changed:", event.path);
 * });
 * // On unmount:
 * disconnect();
 */
function connectPreviewSocket(onEvent) {
  let ws = null;
  let stopped = false;
  let retryTimeout = null;
  function connect() {
    if (stopped) return;
    ws = new WebSocket(exports.PREVIEW_WS_URL);
    ws.addEventListener("message", (e) => {
      try {
        const msg = JSON.parse(e.data);
        // Validate the message shape before forwarding to the caller.
        if (typeof msg === "object" && msg !== null && msg.type === "change") {
          onEvent(msg);
        }
      } catch {
        // Ignore malformed or non-JSON messages.
      }
    });
    ws.addEventListener("close", () => {
      if (stopped) return;
      // Schedule a reconnect attempt. We use a fixed 2 s delay rather than
      // exponential back-off since the server is always local.
      retryTimeout = setTimeout(connect, 2000);
    });
    // Trigger a clean close on errors so the "close" handler handles reconnect.
    ws.addEventListener("error", () => ws?.close());
  }
  connect();
  return () => {
    stopped = true;
    if (retryTimeout !== null) clearTimeout(retryTimeout);
    ws?.close();
  };
}
