import { timingSafeEqual } from "node:crypto";

/** Compares two strings in constant time; unequal lengths short-circuit (only the length is leaked). */
export function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}
