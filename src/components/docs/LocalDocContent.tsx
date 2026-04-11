"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { DocsBody, DocsPage } from "fumadocs-ui/page";
import { useLocalPreview } from "./LocalPreviewContext";

const PREVIEW_URL = "http://localhost:4987";

interface Props {
  /** Relative path within docs/, e.g. "getting-started.md" or "index.md" */
  path: string;
  /** Fallback path tried when the primary path returns 404 */
  fallbackPath?: string;
}

/**
 * Fetches a single file from the local docs-preview server and renders it
 * with react-markdown. Re-fetches automatically when any file in the docs/
 * folder changes (driven by the LocalPreviewContext WebSocket).
 *
 * Shared between local/page.tsx and local/[...slug]/page.tsx.
 */
export function LocalDocContent({ path, fallbackPath }: Props) {
  const { changeCount } = useLocalPreview();
  const [content, setContent] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    setNotFound(false);

    async function fetchContent(filePath: string): Promise<string | null> {
      const res = await fetch(
        `${PREVIEW_URL}/file?path=${encodeURIComponent(filePath)}`,
      );
      if (res.ok) return res.text();
      return null;
    }

    fetchContent(path).then(async (text) => {
      if (text !== null) {
        setContent(text);
        return;
      }
      if (fallbackPath) {
        const fallback = await fetchContent(fallbackPath);
        if (fallback !== null) {
          setContent(fallback);
          return;
        }
      }
      setNotFound(true);
    });
  }, [path, fallbackPath, changeCount]);

  if (notFound) {
    return (
      <DocsPage>
        <DocsBody>
          <p className="text-fd-muted-foreground">
            File not found: <code>{path}</code>
          </p>
        </DocsBody>
      </DocsPage>
    );
  }

  if (content === null) {
    return (
      <DocsPage>
        <DocsBody>
          <p className="text-fd-muted-foreground animate-pulse">Loading…</p>
        </DocsBody>
      </DocsPage>
    );
  }

  return (
    <DocsPage>
      <DocsBody>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </DocsBody>
    </DocsPage>
  );
}
