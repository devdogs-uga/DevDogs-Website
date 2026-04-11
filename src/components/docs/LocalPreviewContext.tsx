"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

const PREVIEW_URL = "http://localhost:4987";
const WS_URL = "ws://localhost:4987/ws";

interface LocalPreviewContextValue {
  connected: boolean;
  /** Increments each time any file in docs/ changes. */
  changeCount: number;
}

const LocalPreviewContext = createContext<LocalPreviewContextValue>({
  connected: false,
  changeCount: 0,
});

export function useLocalPreview() {
  return useContext(LocalPreviewContext);
}

interface Props {
  children: React.ReactNode;
}

/**
 * Manages the WebSocket connection to the local docs-preview server and
 * provides connection state + change notifications to child components.
 *
 * Owned by the local layout; child pages subscribe via useLocalPreview().
 */
export function LocalPreviewProvider({ children }: Props) {
  const [connected, setConnected] = useState(false);
  const [changeCount, setChangeCount] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // First, verify the HTTP server is reachable
    fetch(`${PREVIEW_URL}/tree`)
      .then((r) => {
        if (r.ok) setConnected(true);
      })
      .catch(() => setConnected(false));

    function connect() {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.addEventListener("open", () => setConnected(true));

      ws.addEventListener("message", (e) => {
        try {
          const msg = JSON.parse(e.data as string);
          if (msg.type === "change") setChangeCount((n) => n + 1);
        } catch {
          // ignore malformed messages
        }
      });

      ws.addEventListener("close", () => {
        setConnected(false);
        // Reconnect after 2s
        setTimeout(connect, 2000);
      });

      ws.addEventListener("error", () => ws.close());
    }

    connect();

    return () => {
      wsRef.current?.close();
    };
  }, []);

  return (
    <LocalPreviewContext value={{ connected, changeCount }}>
      {children}
    </LocalPreviewContext>
  );
}
