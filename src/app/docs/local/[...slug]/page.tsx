"use client";

import { use } from "react";
import { LocalDocContent } from "~/components/docs/LocalDocContent";

interface Props {
  params: Promise<{ slug: string[] }>;
}

export default function LocalPreviewSlugPage({ params }: Props) {
  const { slug } = use(params);
  const filePath = slug.join("/") + ".md";

  return <LocalDocContent path={filePath} />;
}
