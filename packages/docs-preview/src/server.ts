#!/usr/bin/env node

import * as fs from "fs";
import * as http from "http";
import * as path from "path";
import { execSync } from "child_process";
import { watch } from "chokidar";
import { WebSocketServer, type WebSocket } from "ws";
import type { ChangeEvent, DocTreeNode, GitInfo } from "./types";
import { PREVIEW_PORT } from "./client";

const cwd = process.cwd();
const docsPath = path.join(cwd, "docs");

// ── File tree ────────────────────────────────────────────────────────────────

function toTitleCase(name: string): string {
  return name
    .replace(/[-_]/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function stripExt(filePath: string): string {
  return filePath.replace(/\.(md|mdx)$/, "");
}

function getTree(): DocTreeNode[] {
  if (!fs.existsSync(docsPath)) return [];

  const paths: string[] = [];
  function walk(dir: string) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (/\.(md|mdx)$/.test(entry.name)) {
        paths.push(path.relative(docsPath, full).replace(/\\/g, "/"));
      }
    }
  }
  walk(docsPath);
  paths.sort();

  const BASE = "/tools/docs";
  const folders = new Map<string, DocTreeNode & { type: "folder" }>();
  const roots: DocTreeNode[] = [];

  for (const filePath of paths) {
    const stripped = stripExt(filePath);
    const parts = stripped.split("/");
    const fileName = parts.at(-1)!;
    const folderPath = parts.slice(0, -1).join("/");
    const isIndex =
      !!folderPath &&
      (fileName === "index" || fileName.toLowerCase() === "readme");
    const urlSlug = isIndex ? parts.slice(0, -1).join("/") : stripped;
    const href = `${BASE}/docs/${urlSlug}`;
    const title = toTitleCase(isIndex ? (parts.at(-2) ?? fileName) : fileName);

    const node: DocTreeNode & { type: "page" } = {
      type: "page",
      id: href,
      name: title,
      url: href,
      icon: "FileText",
      restrictVisibility: false,
    };

    if (folderPath) {
      let folder = folders.get(folderPath);
      if (!folder) {
        const folderName = folderPath.split("/").at(-1) ?? folderPath;
        folder = {
          type: "folder",
          id: `${BASE}/${folderPath}`,
          name: toTitleCase(folderName),
          children: [],
        };
        folders.set(folderPath, folder);
        const parentPath = folderPath.split("/").slice(0, -1).join("/");
        const parent = parentPath ? folders.get(parentPath) : null;
        if (parent) {
          parent.children.push(folder);
        } else {
          roots.push(folder);
        }
      }
      if (isIndex) {
        folder.children.unshift(node);
      } else {
        folder.children.push(node);
      }
    } else {
      roots.push(node);
    }
  }

  return roots;
}

// ── Git info ─────────────────────────────────────────────────────────────────

function getGitInfo(): GitInfo {
  function git(args: string): string {
    try {
      return execSync(`git ${args}`, {
        cwd,
        encoding: "utf-8",
        stdio: ["pipe", "pipe", "pipe"],
      }).trim();
    } catch {
      return "";
    }
  }

  const branch = git("rev-parse --abbrev-ref HEAD") || "unknown";
  const upstream = git(`rev-parse --abbrev-ref ${branch}@{upstream}`);

  if (!upstream) {
    return { branch, description: "No upstream branch" };
  }

  const ahead = parseInt(git(`rev-list --count ${upstream}..HEAD`), 10) || 0;
  const behind = parseInt(git(`rev-list --count HEAD..${upstream}`), 10) || 0;
  const dirty = git("status --porcelain") !== "";

  if (ahead === 0 && behind === 0 && !dirty) {
    return { branch, description: "Up to date" };
  }

  const parts: string[] = [];
  if (dirty) parts.push("Uncommitted changes");
  if (ahead > 0) parts.push(`${ahead} commit${ahead > 1 ? "s" : ""} ahead`);
  if (behind > 0) parts.push(`${behind} commit${behind > 1 ? "s" : ""} behind`);

  return { branch, description: parts.join(" · ") };
}

// ── HTTP helpers ─────────────────────────────────────────────────────────────

function cors(res: http.ServerResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function json(res: http.ServerResponse, data: unknown, status = 200) {
  cors(res);
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}

function text(res: http.ServerResponse, body: string, status = 200) {
  cors(res);
  res.writeHead(status, { "Content-Type": "text/plain; charset=utf-8" });
  res.end(body);
}

// ── HTTP server ──────────────────────────────────────────────────────────────

const server = http.createServer((req, res) => {
  const url = new URL(req.url ?? "/", `http://localhost:${PREVIEW_PORT}`);

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

// ── WebSocket server ─────────────────────────────────────────────────────────

const wss = new WebSocketServer({ server, path: "/ws" });
const clients = new Set<WebSocket>();

wss.on("connection", (ws) => {
  clients.add(ws);
  ws.on("close", () => clients.delete(ws));
});

function broadcast(payload: ChangeEvent) {
  const msg = JSON.stringify(payload);
  for (const client of clients) {
    if (client.readyState === client.OPEN) client.send(msg);
  }
}

// ── File watcher ─────────────────────────────────────────────────────────────

const watchPaths: string[] = [];
if (fs.existsSync(docsPath)) watchPaths.push(docsPath);

if (watchPaths.length > 0) {
  watch(watchPaths, { ignoreInitial: true }).on(
    "all",
    (_event, changedPath: string) => {
      const relative = path.relative(cwd, changedPath).replace(/\\/g, "/");
      if (relative.startsWith("docs/")) {
        broadcast({ type: "change", path: relative });
      }
    },
  );
}

// ── Start ────────────────────────────────────────────────────────────────────

server.listen(PREVIEW_PORT, () => {
  console.log(`\nDocs preview running on :${PREVIEW_PORT}`);
  console.log(`Visit /docs/local on the site to preview\n`);
});
