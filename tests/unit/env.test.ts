import { expect, it } from "vitest";
import { env } from "@/lib/env";

it("exposes required env vars", () => {
  expect(env.ALLOWED_EMAIL).toBe("athlete@example.com");
  expect(() => env.require("NOT_SET_VAR")).toThrow(/NOT_SET_VAR/);
});
