import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "~/env";
import { schema, relations } from "./schema";

const globalForDb = globalThis as unknown as {
  conn: ReturnType<typeof postgres> | undefined;
};

const conn =
  globalForDb.conn ??
  postgres({
    host: env.POSTGRES_HOST,
    user: env.POSTGRES_USER,
    password: env.POSTGRES_PASSWORD,
    port: env.POSTGRES_PORT,
    database: env.POSTGRES_DATABASE,
    prepare: false,
  });

export const db = drizzle({ client: conn, schema, relations });

if (env.NODE_ENV !== "production") {
  globalForDb.conn = conn;
}
