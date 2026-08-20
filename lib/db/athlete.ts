import { eq } from "drizzle-orm";
import type { AnyDb } from "@/lib/db/types";
import { athletes, type Athlete } from "./schema";

/** Finds the athlete row for the given email (created on first sign-in), returning the existing row on later calls. */
export async function ensureAthlete(dbc: AnyDb, email: string, name?: string | null): Promise<Athlete> {
  const e = email.toLowerCase();
  const existing = await dbc.select().from(athletes).where(eq(athletes.email, e)).limit(1);
  if (existing[0]) return existing[0];
  const [created] = await dbc
    .insert(athletes)
    .values({ email: e, name: name ?? null })
    .returning();
  if (!created) throw new Error("failed to create athlete");
  return created;
}
