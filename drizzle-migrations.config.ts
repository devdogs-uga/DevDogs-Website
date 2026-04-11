import { type Config } from "drizzle-kit";
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

export default {
  schema: "./src/server/db/schema/index.ts",
  dialect: "postgresql",
  casing: "camelCase",
  schemaFilter: ["public"],
  dbCredentials: {
    url: process.env.DB_URL!,
  },
} satisfies Config;
