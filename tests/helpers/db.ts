import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import * as schema from "@/lib/db/schema";

/** Spins up an in-memory PGlite database, migrated to the current schema, for integration tests. */
export async function createTestDb() {
  const client = new PGlite();
  const db = drizzle(client, { schema });
  await migrate(db, { migrationsFolder: path.resolve(__dirname, "../../drizzle") });
  return { db, close: () => client.close() };
}
/** The drizzle database handle returned by {@link createTestDb}. */
export type TestDb = Awaited<ReturnType<typeof createTestDb>>["db"];
