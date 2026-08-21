import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import { env } from "@/lib/env";
import * as schema from "./schema";

// The WebSocket driver is what makes real transactions possible (neon-http cannot
// hold a session open across statements). Vercel's Node runtime has no global
// WebSocket, and neither does local Node 20, so point Neon at the `ws` package.
if (typeof WebSocket === "undefined") neonConfig.webSocketConstructor = ws;

/** Production Drizzle client backed by Neon's WebSocket (pooled) driver, which supports transactions. */
export const db = drizzle(new Pool({ connectionString: env.DATABASE_URL }), { schema });
/** Type of the Neon-backed production database handle. */
export type Db = typeof db;
