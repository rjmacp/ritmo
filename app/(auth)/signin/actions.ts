"use server";

import { redirect } from "next/navigation";
import { signIn } from "@/lib/auth";
import { isAllowedEmail } from "@/lib/auth-rules";

/** Sends a magic-link sign-in email to the address submitted from the sign-in form. */
export async function sendSignInLink(formData: FormData): Promise<void> {
  const email = formData.get("email");
  if (typeof email !== "string") throw new Error("missing email");
  // A non-allowed address gets exactly the response an allowed one does: letting the
  // error surface would turn this form into an "is this address registered?" oracle.
  if (!isAllowedEmail(email)) redirect("/signin?sent=1");
  await signIn("resend", { email, redirectTo: "/runs" });
}
