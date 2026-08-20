export { auth as middleware } from "@/lib/auth";

export const config = {
  matcher: ["/((?!api/strava/webhook|api/cron|api/auth|signin|manifest.webmanifest|icons|_next|favicon.ico).*)"],
};
