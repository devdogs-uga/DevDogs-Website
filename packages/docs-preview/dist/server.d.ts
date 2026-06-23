#!/usr/bin/env node
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
export {};
