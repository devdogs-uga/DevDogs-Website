#!/usr/bin/env node
"use strict";
/**
 * @devdogsuga/docs-preview — local documentation preview server.
 *
 * Run this from a project's root directory with `pnpm docs:preview` (or
 * `npx docs-preview`). It serves three HTTP endpoints and a WebSocket channel:
 *
 * - GET /tree          JSON array of markdown file paths relative to cwd
 * - GET /git           JSON object with branch name and working-tree status
 * - GET /file?path=… Raw markdown content of a single file
 * - WS  /ws            Broadcasts a ChangeEvent whenever a watched file changes
 *
 * Consumers (e.g. the DevDogs website) interact with this server through the
 * typed helpers exported by the `./client` module rather than making raw
 * HTTP/WebSocket requests.
 */
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
const fs = __importStar(require("fs"));
const http = __importStar(require("http"));
const path = __importStar(require("path"));
const child_process_1 = require("child_process");
const chokidar_1 = require("chokidar");
const ws_1 = require("ws");
const client_1 = require("./client");
const cwd = process.cwd();
const docsPath = path.join(cwd, "docs");
// ── File tree ──────────────────────────────────────────────────────────────────
/**
 * Builds the list of markdown files to expose over the HTTP API.
 *
 * Two kinds of paths are returned:
 * - **Bare filenames** (e.g. `"README.md"`) for SCREAMING_SNAKE_CASE files at
 *   the project root — these become Introduction section entries.
 * - **`"docs/..."` paths** (e.g. `"docs/getting-started.md"`) for every
 *   markdown file found recursively under `cwd/docs/`.
 */
function getTree() {
  const entries = [];
  // Scan the project root for SCREAMING_SNAKE_CASE markdown files.
  for (const entry of fs.readdirSync(cwd, { withFileTypes: true })) {
    if (!entry.isFile()) continue;
    if (!/\.(md|mdx)$/.test(entry.name)) continue;
    const base = entry.name.replace(/\.(md|mdx)$/, "");
    if (client_1.SCREAMING_SNAKE_CASE.test(base)) entries.push(entry.name);
  }
  // Recursively walk docs/ and collect all markdown files.
  if (fs.existsSync(docsPath)) {
    function walk(dir) {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          walk(full);
        } else if (/\.(md|mdx)$/.test(entry.name)) {
          // Return paths as "docs/..." relative to cwd.
          entries.push(path.relative(cwd, full).replace(/\\/g, "/"));
        }
      }
    }
    walk(docsPath);
  }
  return entries;
}
// ── Git info ──────────────────────────────────────────────────────────────────
/**
 * Returns the current git branch and a human-readable description of the
 * working tree's status relative to the configured upstream branch.
 *
 * All git commands are run silently — if any command fails (e.g. the directory
 * is not a git repo), the function returns graceful fallback strings rather
 * than throwing.
 */
function getGitInfo() {
  /**
   * Runs a git command in cwd and returns trimmed stdout.
   * Returns an empty string on any error (missing git, non-repo, etc.).
   */
  function git(args) {
    try {
      return (0, child_process_1.execSync)(`git ${args}`, {
        cwd,
        encoding: "utf-8",
        stdio: ["pipe", "pipe", "pipe"],
      }).trim();
    } catch {
      return "";
    }
  }
  const branch = git("rev-parse --abbrev-ref HEAD") || "unknown";
  // Resolve the tracking upstream for the current branch (may be empty if
  // there is no upstream configured).
  const upstream = git(`rev-parse --abbrev-ref ${branch}@{upstream}`);
  if (!upstream) {
    return { branch, description: "No upstream branch" };
  }
  // Count commits that exist on HEAD but not upstream, and vice versa.
  const ahead = parseInt(git(`rev-list --count ${upstream}..HEAD`), 10) || 0;
  const behind = parseInt(git(`rev-list --count HEAD..${upstream}`), 10) || 0;
  // `git status --porcelain` outputs one line per change; empty means clean.
  const dirty = git("status --porcelain") !== "";
  if (ahead === 0 && behind === 0 && !dirty) {
    return { branch, description: "Up to date" };
  }
  const parts = [];
  if (dirty) parts.push("Uncommitted changes");
  if (ahead > 0) parts.push(`${ahead} commit${ahead > 1 ? "s" : ""} ahead`);
  if (behind > 0) parts.push(`${behind} commit${behind > 1 ? "s" : ""} behind`);
  return { branch, description: parts.join(" · ") };
}
// ── CORS & response helpers ───────────────────────────────────────────────────
/**
 * Adds permissive CORS headers to a response.
 * All endpoints allow any origin so the Next.js dev server (different port)
 * can reach the preview server without proxy configuration.
 */
function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}
/** Writes a JSON response with CORS headers. */
function json(res, data, status = 200) {
  cors(res);
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}
/** Writes a plain-text response with CORS headers. */
function text(res, body, status = 200) {
  cors(res);
  res.writeHead(status, { "Content-Type": "text/plain; charset=utf-8" });
  res.end(body);
}
// ── HTTP server ───────────────────────────────────────────────────────────────
const server = http.createServer((req, res) => {
  const url = new URL(
    req.url ?? "/",
    `http://localhost:${client_1.PREVIEW_PORT}`,
  );
  // Handle CORS preflight requests from the browser.
  if (req.method === "OPTIONS") {
    cors(res);
    res.writeHead(204);
    res.end();
    return;
  }
  if (url.pathname === "/tree") {
    json(res, getTree());
    return;
  }
  if (url.pathname === "/git") {
    json(res, getGitInfo());
    return;
  }
  if (url.pathname === "/file") {
    const filePath = url.searchParams.get("path");
    if (!filePath) {
      text(res, "Missing ?path", 400);
      return;
    }
    // Resolve the requested path relative to cwd and ensure it doesn't escape
    // the project root (path traversal guard).
    const resolved = path.resolve(cwd, filePath);
    if (!resolved.startsWith(cwd + path.sep) && resolved !== cwd) {
      text(res, "Forbidden", 403);
      return;
    }
    if (!fs.existsSync(resolved)) {
      text(res, "Not found", 404);
      return;
    }
    text(res, fs.readFileSync(resolved, "utf-8"));
    return;
  }
  text(res, "Not found", 404);
});
// ── WebSocket server ──────────────────────────────────────────────────────────
/** Upgrade connections on the /ws path to WebSocket. */
const wss = new ws_1.WebSocketServer({ server, path: "/ws" });
const clients = new Set();
wss.on("connection", (ws) => {
  clients.add(ws);
  ws.on("close", () => clients.delete(ws));
});
/**
 * Sends a {@link ChangeEvent} to every currently connected WebSocket client.
 * Clients that are no longer in the OPEN state are silently skipped.
 */
function broadcast(payload) {
  const msg = JSON.stringify(payload);
  for (const client of clients) {
    if (client.readyState === client.OPEN) client.send(msg);
  }
}
// ── File watcher ──────────────────────────────────────────────────────────────
// Collect the paths to watch: the docs/ directory (if it exists) and any
// SCREAMING_SNAKE_CASE markdown files at the project root.
const watchPaths = [];
if (fs.existsSync(docsPath)) watchPaths.push(docsPath);
for (const entry of fs.readdirSync(cwd, { withFileTypes: true })) {
  if (!entry.isFile()) continue;
  if (!/\.(md|mdx)$/.test(entry.name)) continue;
  const base = entry.name.replace(/\.(md|mdx)$/, "");
  if (client_1.SCREAMING_SNAKE_CASE.test(base))
    watchPaths.push(path.join(cwd, entry.name));
}
(0, chokidar_1.watch)(watchPaths, { ignoreInitial: true }).on(
  "all",
  (_event, changedPath) => {
    // Broadcast the path relative to cwd so clients can match it against the
    // paths returned by /tree.
    broadcast({
      type: "change",
      path: path.relative(cwd, changedPath).replace(/\\/g, "/"),
    });
  },
);
// ── Start ─────────────────────────────────────────────────────────────────────
server.listen(client_1.PREVIEW_PORT, () => {
  console.log(`\nDocs preview running on :${client_1.PREVIEW_PORT}`);
  console.log(`Visit /docs/local on the site to preview\n`);
});
