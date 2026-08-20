import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { env } from "@/lib/env";
import * as schema from "./schema";

/** Production Drizzle client backed by Neon's HTTP driver. */
export const db = drizzle(neon(env.DATABASE_URL), { schema });
/** Type of the Neon-backed production database handle. */
export type Db = typeof db;
