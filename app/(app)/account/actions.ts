"use server";
import { revalidatePath } from "next/cache";
import { requireAthlete, signOut } from "@/lib/auth";
import { setMaxHr } from "@/lib/db/athlete";
import { db } from "@/lib/db/client";

/** Server action: updates the signed-in athlete's max HR from the Account form (silently ignoring out-of-range input). */
export async function updateAthlete(fd: FormData): Promise<void> {
  const athlete = await requireAthlete();
  const maxHr = Number(fd.get("maxHr"));
  if (Number.isFinite(maxHr) && maxHr >= 120 && maxHr <= 230) await setMaxHr(db, athlete.id, Math.round(maxHr));
  revalidatePath("/account");
}

/** Server action: signs the current athlete out and redirects to the sign-in page. */
export async function signOutAction(): Promise<void> {
  await signOut({ redirectTo: "/signin" });
}
