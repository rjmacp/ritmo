import { env } from "@/lib/env";

/** Whether the given email matches the single allow-listed athlete email, case-insensitively. */
export function isAllowedEmail(email: string | null | undefined): boolean {
  return !!email && email.toLowerCase() === env.ALLOWED_EMAIL;
}
