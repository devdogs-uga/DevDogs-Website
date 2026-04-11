#!/usr/bin/env node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const http = __importStar(require("http"));
const path = __importStar(require("path"));
const chokidar_1 = require("chokidar");
const ws_1 = require("ws");
const PORT = 4987;
const docsPath = path.join(process.cwd(), "docs");
// ── File tree ──────────────────────────────────────────────────────────────────
function getTree() {
    const entries = [];
    function walk(dir) {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
            const full = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                walk(full);
            }
            else if (/\.(md|mdx)$/.test(entry.name)) {
                entries.push(path.relative(docsPath, full).replace(/\\/g, "/"));
            }
        }
    }
    if (fs.existsSync(docsPath))
        walk(docsPath);
    return entries;
}
// ── CORS helper ───────────────────────────────────────────────────────────────
function cors(res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}
function json(res, data, status = 200) {
    cors(res);
    res.writeHead(status, { "Content-Type": "application/json" });
    res.end(JSON.stringify(data));
}
function text(res, body, status = 200) {
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
const wss = new ws_1.WebSocketServer({ server, path: "/ws" });
const clients = new Set();
wss.on("connection", (ws) => {
    clients.add(ws);
    ws.on("close", () => clients.delete(ws));
});
function broadcast(payload) {
    const msg = JSON.stringify(payload);
    for (const client of clients) {
        if (client.readyState === client.OPEN) {
            client.send(msg);
        }
    }
}
// ── File watcher ──────────────────────────────────────────────────────────────
(0, chokidar_1.watch)(docsPath, { ignoreInitial: true }).on("all", (event, filePath) => {
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
