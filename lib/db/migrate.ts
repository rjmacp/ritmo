import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { migrate } from "drizzle-orm/neon-http/migrator";
import { env } from "@/lib/env";

/** CLI script: applies pending Drizzle migrations in ./drizzle to DATABASE_URL. */
async function main(): Promise<void> {
  const sql = neon(env.DATABASE_URL);
  await migrate(drizzle(sql), { migrationsFolder: "./drizzle" });
  process.stdout.write("migrations applied\n");
}

await main();
