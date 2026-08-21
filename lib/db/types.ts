import type { NeonDatabase } from "drizzle-orm/neon-serverless";
import type { PgliteDatabase } from "drizzle-orm/pglite";
import type * as schema from "./schema";

/** A Drizzle database handle that works against either Neon (prod) or PGlite (tests). */
export type AnyDb = NeonDatabase<typeof schema> | PgliteDatabase<typeof schema>;

/** The transaction entry point both drivers share; the union itself has no callable `transaction` signature. */
interface TxCapable {
  transaction: <T>(fn: (tx: AnyDb) => Promise<T>) => Promise<T>;
}

/** Runs `fn` inside a database transaction, rolling back every write if it throws. */
export function withTx<T>(dbc: AnyDb, fn: (tx: AnyDb) => Promise<T>): Promise<T> {
  return (dbc as unknown as TxCapable).transaction(fn);
}
