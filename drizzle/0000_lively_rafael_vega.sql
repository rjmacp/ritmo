CREATE TABLE "account" (
	"userId" text NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"providerAccountId" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text,
	CONSTRAINT "account_provider_providerAccountId_pk" PRIMARY KEY("provider","providerAccountId")
);
--> statement-breakpoint
CREATE TABLE "activities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"athlete_id" uuid NOT NULL,
	"source" text NOT NULL,
	"strava_id" bigint,
	"started_at" timestamp with time zone NOT NULL,
	"timezone" text NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"type_overridden" boolean DEFAULT false NOT NULL,
	"surface" text,
	"distance_m" real NOT NULL,
	"moving_s" integer NOT NULL,
	"elapsed_s" integer NOT NULL,
	"avg_pace_s_per_km" real NOT NULL,
	"avg_gap_s_per_km" real,
	"avg_hr" real,
	"max_hr" real,
	"avg_cadence" real,
	"elevation_gain_m" real,
	"calories" real,
	"start_lat" real,
	"start_lng" real,
	"training_effect_aerobic" real,
	"training_effect_anaerobic" real,
	"notes" text,
	"raw_json" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "athletes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"max_hr" integer,
	"resting_hr" integer,
	"hr_zone_boundaries" jsonb,
	"units" text DEFAULT 'km' NOT NULL,
	"season_start_month" integer DEFAULT 1 NOT NULL,
	"season_start_day" integer DEFAULT 1 NOT NULL,
	"coach_prefs" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "athletes_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "laps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"activity_id" uuid NOT NULL,
	"index" integer NOT NULL,
	"distance_m" real NOT NULL,
	"moving_s" integer NOT NULL,
	"avg_hr" real,
	"max_hr" real,
	"avg_cadence" real,
	"elevation_gain_m" real,
	"elevation_loss_m" real,
	"gap_s_per_km" real
);
--> statement-breakpoint
CREATE TABLE "session" (
	"sessionToken" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"expires" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "strava_connections" (
	"athlete_id" uuid PRIMARY KEY NOT NULL,
	"strava_athlete_id" bigint NOT NULL,
	"access_token" text NOT NULL,
	"refresh_token" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"last_sync_at" timestamp with time zone,
	"import_status" text DEFAULT 'idle' NOT NULL,
	"imported_count" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sync_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"athlete_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone,
	"status" text DEFAULT 'running' NOT NULL,
	"activities_processed" integer DEFAULT 0 NOT NULL,
	"error" text
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"email" text,
	"emailVerified" timestamp,
	"image" text,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verificationToken" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "verificationToken_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_athlete_id_athletes_id_fk" FOREIGN KEY ("athlete_id") REFERENCES "public"."athletes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "laps" ADD CONSTRAINT "laps_activity_id_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "strava_connections" ADD CONSTRAINT "strava_connections_athlete_id_athletes_id_fk" FOREIGN KEY ("athlete_id") REFERENCES "public"."athletes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sync_log" ADD CONSTRAINT "sync_log_athlete_id_athletes_id_fk" FOREIGN KEY ("athlete_id") REFERENCES "public"."athletes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "activities_athlete_strava_idx" ON "activities" USING btree ("athlete_id","strava_id");--> statement-breakpoint
CREATE INDEX "activities_athlete_started_idx" ON "activities" USING btree ("athlete_id","started_at");--> statement-breakpoint
CREATE UNIQUE INDEX "laps_activity_index_idx" ON "laps" USING btree ("activity_id","index");