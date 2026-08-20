"use server";

import { signIn } from "@/lib/auth";

/** Sends a magic-link sign-in email to the address submitted from the sign-in form. */
export async function sendSignInLink(formData: FormData): Promise<void> {
  const email = formData.get("email");
  if (typeof email !== "string") throw new Error("missing email");
  await signIn("resend", { email, redirectTo: "/runs" });
}
