import { createClient } from "@vercel/edge-config";
import type { z } from "zod";
import { env } from "~/env";
import * as schema from "./schema";

export type EdgeConfigSchema<K extends keyof typeof schema> = z.infer<
  (typeof schema)[K]
>;

export async function getEdgeConfig<K extends keyof typeof schema>(key: K) {
  return await schema[key].parseAsync(
    env.EDGE_CONFIG ? await createClient(env.EDGE_CONFIG).get(key) : undefined,
  );
}
