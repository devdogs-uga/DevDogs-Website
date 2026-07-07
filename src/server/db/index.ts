import { drizzle } from "drizzle-orm/mysql2";
import {
  createConnection,
  type Connection
} from "mysql2/promise";
import { env } from "~/env";
import { relations, schema } from "./schema";

async function getDB() {
  const globalForDb = globalThis as unknown as {
    connection: Connection | undefined;
  };

  const client =
    globalForDb.connection ??
    (await createConnection({
      host: env.MYSQL_HOST,
      user: env.MYSQL_USER,
      password: env.MYSQL_PASSWORD,
      port: env.MYSQL_PORT,
      database: env.MYSQL_DATABASE,
      disableEval: true,
    }));

  const db = drizzle({ client, schema, relations, mode: "default" });

  if (env.NODE_ENV !== "production") {
    globalForDb.connection = client;
  }

  return db;
}

export const db = await getDB();
