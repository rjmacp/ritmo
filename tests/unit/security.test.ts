import { describe, it, expect } from "vitest";
import { safeEqual } from "@/lib/security";

describe("safeEqual", () => {
  it("is true only for identical strings", () => {
    expect(safeEqual("s3cret", "s3cret")).toBe(true);
    expect(safeEqual("s3cret", "s3crey")).toBe(false);
  });

  it("returns false rather than throwing on different lengths", () => {
    expect(safeEqual("short", "much-longer")).toBe(false);
    expect(safeEqual("", "x")).toBe(false);
    expect(safeEqual("", "")).toBe(true);
  });

  it("compares by bytes, not code units", () => {
    expect(safeEqual("café", "café")).toBe(true);
    expect(safeEqual("café", "cafe")).toBe(false);
  });
});
