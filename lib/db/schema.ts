import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  real,
  bigint,
  jsonb,
  boolean,
  primaryKey,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import type { AdapterAccountType } from "next-auth/adapters";

// ---- Auth.js tables (required by @auth/drizzle-adapter) ----

/** Auth.js `user` table: one row per authenticated person. */
export const users = pgTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
});

/** Auth.js `account` table: OAuth/credential accounts linked to a user. */
export const accounts = pgTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (t) => [primaryKey({ columns: [t.provider, t.providerAccountId] })],
);

/** Auth.js `session` table: active login sessions. */
export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

/** Auth.js `verificationToken` table: email magic-link/OTP tokens. */
export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.identifier, t.token] })],
);

// ---- Ritmo tables ----

/** Coach athletes: the app's core account/profile table. */
export const athletes = pgTable("athletes", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name"),
  maxHr: integer("max_hr"),
  restingHr: integer("resting_hr"),
  hrZoneBoundaries: jsonb("hr_zone_boundaries").$type<[number, number, number, number] | null>(),
  units: text("units").notNull().default("km"),
  seasonStartMonth: integer("season_start_month").notNull().default(1),
  seasonStartDay: integer("season_start_day").notNull().default(1),
  coachPrefs: jsonb("coach_prefs").$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Per-athlete Strava OAuth tokens and import status. */
export const stravaConnections = pgTable("strava_connections", {
  athleteId: uuid("athlete_id")
    .primaryKey()
    .references(() => athletes.id, { onDelete: "cascade" }),
  stravaAthleteId: bigint("strava_athlete_id", { mode: "bigint" }).notNull(),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  lastSyncAt: timestamp("last_sync_at", { withTimezone: true }),
  importStatus: text("import_status").notNull().default("idle"), // idle | running | done | failed
  importedCount: integer("imported_count").notNull().default(0),
});

/** Coach-facing workout classifications assignable to an activity. */
export const ACTIVITY_TYPES = ["easy", "medium", "tempo", "long", "race", "tt", "other"] as const;
/** One of {@link ACTIVITY_TYPES}. */
export type ActivityType = (typeof ACTIVITY_TYPES)[number];

/** A single run, imported from Strava or uploaded, with derived training metrics. */
export const activities = pgTable(
  "activities",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    athleteId: uuid("athlete_id")
      .notNull()
      .references(() => athletes.id, { onDelete: "cascade" }),
    source: text("source").notNull(), // strava | upload
    stravaId: bigint("strava_id", { mode: "bigint" }),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
    timezone: text("timezone").notNull(),
    name: text("name").notNull(),
    type: text("type").$type<ActivityType>().notNull(),
    typeOverridden: boolean("type_overridden").notNull().default(false),
    surface: text("surface"),
    distanceM: real("distance_m").notNull(),
    movingS: integer("moving_s").notNull(),
    elapsedS: integer("elapsed_s").notNull(),
    avgPaceSPerKm: real("avg_pace_s_per_km").notNull(),
    avgGapSPerKm: real("avg_gap_s_per_km"),
    avgHr: real("avg_hr"),
    maxHr: real("max_hr"),
    avgCadence: real("avg_cadence"),
    elevationGainM: real("elevation_gain_m"),
    calories: real("calories"),
    startLat: real("start_lat"),
    startLng: real("start_lng"),
    trainingEffectAerobic: real("training_effect_aerobic"),
    trainingEffectAnaerobic: real("training_effect_anaerobic"),
    notes: text("notes"),
    rawJson: jsonb("raw_json").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("activities_athlete_strava_idx").on(t.athleteId, t.stravaId),
    index("activities_athlete_started_idx").on(t.athleteId, t.startedAt),
  ],
);

/** A distance/lap split within an activity. */
export const laps = pgTable(
  "laps",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    activityId: uuid("activity_id")
      .notNull()
      .references(() => activities.id, { onDelete: "cascade" }),
    index: integer("index").notNull(),
    distanceM: real("distance_m").notNull(),
    movingS: integer("moving_s").notNull(),
    avgHr: real("avg_hr"),
    maxHr: real("max_hr"),
    avgCadence: real("avg_cadence"),
    elevationGainM: real("elevation_gain_m"),
    elevationLossM: real("elevation_loss_m"),
    gapSPerKm: real("gap_s_per_km"),
  },
  (t) => [uniqueIndex("laps_activity_index_idx").on(t.activityId, t.index)],
);

/** Audit log of sync/import runs (webhook, cron, manual, import, upload) per athlete. */
export const syncLog = pgTable("sync_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  athleteId: uuid("athlete_id")
    .notNull()
    .references(() => athletes.id, { onDelete: "cascade" }),
  kind: text("kind").notNull(), // webhook | cron | manual | import | upload
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
  status: text("status").notNull().default("running"), // running | ok | failed
  activitiesProcessed: integer("activities_processed").notNull().default(0),
  error: text("error"),
});

/** Row shape returned when selecting from {@link athletes}. */
export type Athlete = typeof athletes.$inferSelect;
/** Row shape returned when selecting from {@link activities}. */
export type Activity = typeof activities.$inferSelect;
/** Row shape accepted when inserting into {@link activities}. */
export type NewActivity = typeof activities.$inferInsert;
/** Row shape returned when selecting from {@link laps}. */
export type Lap = typeof laps.$inferSelect;
/** Row shape accepted when inserting into {@link laps}. */
export type NewLap = typeof laps.$inferInsert;
/** Row shape returned when selecting from {@link stravaConnections}. */
export type StravaConnection = typeof stravaConnections.$inferSelect;
