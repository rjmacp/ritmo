function require(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var ${name}`);
  return v;
}

export const env = {
  require,
  get DATABASE_URL() {
    return require("DATABASE_URL");
  },
  get AUTH_SECRET() {
    return require("AUTH_SECRET");
  },
  get ALLOWED_EMAIL() {
    return require("ALLOWED_EMAIL").toLowerCase();
  },
  get STRAVA_CLIENT_ID() {
    return require("STRAVA_CLIENT_ID");
  },
  get STRAVA_CLIENT_SECRET() {
    return require("STRAVA_CLIENT_SECRET");
  },
  get STRAVA_WEBHOOK_VERIFY_TOKEN() {
    return require("STRAVA_WEBHOOK_VERIFY_TOKEN");
  },
  get CRON_SECRET() {
    return require("CRON_SECRET");
  },
  get APP_URL() {
    return require("NEXT_PUBLIC_APP_URL");
  },
  get RESEND_API_KEY() {
    return require("AUTH_RESEND_KEY");
  },
  get EMAIL_FROM() {
    return process.env.EMAIL_FROM ?? "Ritmo <login@ritmo.run>";
  },
};
