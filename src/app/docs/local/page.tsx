"use client";

import { LocalDocContent } from "~/components/docs/LocalDocContent";

export default function LocalPreviewIndexPage() {
  return <LocalDocContent path="index.md" fallbackPath="README.md" />;
}
