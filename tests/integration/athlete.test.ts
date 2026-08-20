import { it, expect, beforeAll, afterAll } from "vitest";
import { ensureAthlete } from "@/lib/db/athlete";
import { createTestDb, type TestDb } from "../helpers/db";

let db: TestDb;
let close: () => Promise<void>;
beforeAll(async () => ({ db, close } = await createTestDb()));
afterAll(() => close());

it("creates an athlete once and returns the same row after", async () => {
  const a = await ensureAthlete(db, "athlete@example.com", "Rob");
  const b = await ensureAthlete(db, "ATHLETE@example.com");
  expect(a.id).toBe(b.id);
  expect(b.name).toBe("Rob");
});
