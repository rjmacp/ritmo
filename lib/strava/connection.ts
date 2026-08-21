import { eq } from "drizzle-orm";
import type { PgUpdateSetSource } from "drizzle-orm/pg-core";
import { stravaConnections, type StravaConnection } from "@/lib/db/schema";
import type { AnyDb } from "@/lib/db/types";
import { StravaClient, type StravaTokens } from "./client";

/** Inserts or updates the stored Strava OAuth tokens for an athlete's connection. */
export async function saveConnection(
  dbc: AnyDb,
  athleteId: string,
  tokens: StravaTokens,
  stravaAthleteId: bigint,
): Promise<void> {
  await dbc
    .insert(stravaConnections)
    .values({
      athleteId,
      stravaAthleteId,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: tokens.expiresAt,
    })
    .onConflictDoUpdate({
      target: stravaConnections.athleteId,
      set: {
        stravaAthleteId,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: tokens.expiresAt,
      },
    });
}

/** Updates the given columns on an athlete's `strava_connections` row; the one place that owns that UPDATE. */
export async function setConnectionFields(
  dbc: AnyDb,
  athleteId: string,
  patch: PgUpdateSetSource<typeof stravaConnections>,
): Promise<void> {
  await dbc.update(stravaConnections).set(patch).where(eq(stravaConnections.athleteId, athleteId));
}

/** Overwrites an athlete's stored access/refresh tokens, e.g. after `StravaClient` refreshes them. */
export function updateTokens(dbc: AnyDb, athleteId: string, t: StravaTokens): Promise<void> {
  return setConnectionFields(dbc, athleteId, {
    accessToken: t.accessToken,
    refreshToken: t.refreshToken,
    expiresAt: t.expiresAt,
  });
}

/** Fetches an athlete's Strava connection row, or `null` if they haven't connected. */
export async function getConnection(dbc: AnyDb, athleteId: string): Promise<StravaConnection | null> {
  const [c] = await dbc.select().from(stravaConnections).where(eq(stravaConnections.athleteId, athleteId)).limit(1);
  return c ?? null;
}

/** Builds a `StravaClient` for the athlete's stored tokens, wired to persist refreshes; `null` if not connected. */
export async function clientForAthlete(dbc: AnyDb, athleteId: string): Promise<StravaClient | null> {
  const c = await getConnection(dbc, athleteId);
  if (!c) return null;
  return new StravaClient({ accessToken: c.accessToken, refreshToken: c.refreshToken, expiresAt: c.expiresAt }, (t) =>
    updateTokens(dbc, athleteId, t),
  );
}

/** Removes an athlete's stored Strava connection (does not revoke the token with Strava). */
export async function deleteConnection(dbc: AnyDb, athleteId: string): Promise<void> {
  await dbc.delete(stravaConnections).where(eq(stravaConnections.athleteId, athleteId));
}

/** Looks up the Ritmo athlete id connected to a given Strava athlete id, e.g. for webhook dispatch. */
export async function athleteIdForStravaAthlete(dbc: AnyDb, stravaAthleteId: bigint): Promise<string | null> {
  const [c] = await dbc
    .select({ athleteId: stravaConnections.athleteId })
    .from(stravaConnections)
    .where(eq(stravaConnections.stravaAthleteId, stravaAthleteId))
    .limit(1);
  return c?.athleteId ?? null;
}
