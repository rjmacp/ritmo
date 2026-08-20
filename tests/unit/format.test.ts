import { describe, expect, it } from "vitest";
import { formatDuration, formatKm, formatPace } from "@/lib/format";

describe("format", () => {
  it("formats pace as m:ss", () => {
    expect(formatPace(326)).toBe("5:26");
    expect(formatPace(365.4)).toBe("6:05");
  });
  it("formats durations under and over an hour", () => {
    expect(formatDuration(2412)).toBe("40:12");
    expect(formatDuration(5330)).toBe("1:28:50");
  });
  it("formats km to one decimal", () => {
    expect(formatKm(7410)).toBe("7.4");
    expect(formatKm(16100)).toBe("16.1");
  });
});
