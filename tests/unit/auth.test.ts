import { it, expect } from "vitest";
import { isAllowedEmail } from "@/lib/auth-rules";

it("allows only the configured email, case-insensitively", () => {
  expect(isAllowedEmail("Athlete@Example.com")).toBe(true);
  expect(isAllowedEmail("other@example.com")).toBe(false);
  expect(isAllowedEmail(null)).toBe(false);
});
