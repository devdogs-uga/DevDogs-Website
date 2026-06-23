import type { ChangeEvent, DocTreeNode, GitInfo } from "./types";

export type { ChangeEvent, DocTreeNode, GitInfo };

export const PREVIEW_PORT = 4987;
export const PREVIEW_URL = `http://localhost:${PREVIEW_PORT}`;
export const PREVIEW_WS_URL = `ws://localhost:${PREVIEW_PORT}/ws`;

export async function fetchTree(): Promise<DocTreeNode[]> {
  const res = await fetch(`${PREVIEW_URL}/tree`);
  if (!res.ok) throw new Error(`/tree returned ${res.status}`);
  return res.json() as Promise<DocTreeNode[]>;
}

export async function fetchGitInfo(): Promise<GitInfo> {
  const res = await fetch(`${PREVIEW_URL}/git`);
  if (!res.ok) throw new Error(`/git returned ${res.status}`);
  return res.json() as Promise<GitInfo>;
}

export async function checkPreviewServer(): Promise<boolean> {
  try {
    const res = await fetch(`${PREVIEW_URL}/tree`, { cache: "no-store" });
    return res.ok;
  } catch {
    return false;
  }
}

export async function fetchFile(filePath: string): Promise<string | null> {
  const res = await fetch(
    `${PREVIEW_URL}/file?path=${encodeURIComponent(filePath)}`,
  );
  if (res.status === 404) return null;
  if (!res.ok)
    throw new Error(`/file returned ${res.status} for "${filePath}"`);
  return res.text();
}

export function connectPreviewSocket(
  onEvent: (event: ChangeEvent) => void,
): () => void {
  let ws: WebSocket | null = null;
  let stopped = false;
  let retryTimeout: ReturnType<typeof setTimeout> | null = null;

  function connect() {
    if (stopped) return;

    ws = new WebSocket(PREVIEW_WS_URL);

    ws.addEventListener("message", (e) => {
      try {
        const msg = JSON.parse(e.data as string) as unknown;
        if (
          typeof msg === "object" &&
          msg !== null &&
          (msg as Record<string, unknown>).type === "change"
        ) {
          onEvent(msg as ChangeEvent);
        }
      } catch {
        // Ignore malformed messages.
      }
    });

    ws.addEventListener("close", () => {
      if (stopped) return;
      retryTimeout = setTimeout(connect, 2000);
    });

    ws.addEventListener("error", () => ws?.close());
  }

  connect();

  return () => {
    stopped = true;
    if (retryTimeout !== null) clearTimeout(retryTimeout);
    ws?.close();
  };
}
