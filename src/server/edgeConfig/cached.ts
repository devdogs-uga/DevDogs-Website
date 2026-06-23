"use cache";

import { cacheLife } from "next/cache";
import { getEdgeConfig } from ".";
import type { EdgeConfigSchema } from ".";

export async function getCachedEdgeConfig<K extends "docs">(
  key: K,
): Promise<EdgeConfigSchema<K>> {
  cacheLife("days");
  return getEdgeConfig(key);
}
