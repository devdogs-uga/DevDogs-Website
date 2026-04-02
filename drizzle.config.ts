import { type Config } from "drizzle-kit";
import { env } from "~/env";

export default {
  schema: "./src/server/db/schema/tables.ts",
  dialect: "postgresql",
  out: "./drizzle",
  schemaFilter: ["public"],
  dbCredentials: {
    host: env.POSTGRES_HOST,
    user: env.POSTGRES_USER,
    password: env.POSTGRES_PASSWORD,
    port: env.POSTGRES_PORT,
    database: env.POSTGRES_DATABASE,
  },
} satisfies Config;
