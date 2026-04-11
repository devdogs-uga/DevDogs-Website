#!/usr/bin/env node

import * as fs from "fs";
import * as http from "http";
import * as path from "path";
import { watch } from "chokidar";
import { WebSocketServer, type WebSocket } from "ws";

const PORT = 4987;
const docsPath = path.join(process.cwd(), "docs");

// ── File tree ──────────────────────────────────────────────────────────────────

function getTree(): string[] {
  const entries: string[] = [];

  function walk(dir: string) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (/\.(md|mdx)$/.test(entry.name)) {
        entries.push(path.relative(docsPath, full).replace(/\\/g, "/"));
      }
    }
  }

  if (fs.existsSync(docsPath)) walk(docsPath);
  return entries;
}

// ── CORS helper ───────────────────────────────────────────────────────────────

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

// ── HTTP server ───────────────────────────────────────────────────────────────

const server = http.createServer((req, res) => {
  const url = new URL(req.url ?? "/", `http://localhost:${PORT}`);

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

  if (url.pathname === "/file") {
    const filePath = url.searchParams.get("path");
    if (!filePath) {
      text(res, "Missing ?path", 400);
      return;
    }

    // Prevent path traversal
    const resolved = path.resolve(docsPath, filePath);
    if (!resolved.startsWith(docsPath + path.sep) && resolved !== docsPath) {
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

const wss = new WebSocketServer({ server, path: "/ws" });

const clients = new Set<WebSocket>();

wss.on("connection", (ws) => {
  clients.add(ws);
  ws.on("close", () => clients.delete(ws));
});

function broadcast(payload: object) {
  const msg = JSON.stringify(payload);
  for (const client of clients) {
    if (client.readyState === client.OPEN) {
      client.send(msg);
    }
  }
}

// ── File watcher ──────────────────────────────────────────────────────────────

watch(docsPath, { ignoreInitial: true }).on("all", (event, filePath) => {
  broadcast({
    type: "change",
    path: path.relative(docsPath, filePath).replace(/\\/g, "/"),
  });
});

// ── Start ─────────────────────────────────────────────────────────────────────

if (!fs.existsSync(docsPath)) {
  console.error(`No docs/ folder found at ${docsPath}`);
  process.exit(1);
}

server.listen(PORT, () => {
  console.log(`\nDocs preview running on :${PORT}`);
  console.log(`Visit /docs/local on the site to preview\n`);
});
