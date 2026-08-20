import type { NeonHttpDatabase } from "drizzle-orm/neon-http";
import type { PgliteDatabase } from "drizzle-orm/pglite";
import type * as schema from "./schema";

/** A Drizzle database handle that works against either Neon (prod) or PGlite (tests). */
export type AnyDb = NeonHttpDatabase<typeof schema> | PgliteDatabase<typeof schema>;
