import { describe, expect, it } from "vitest";

import {
  getMalaysiaDateValue,
  parseMalaysiaViewingDateTime,
} from "./viewing";

const now = new Date("2026-07-31T02:00:00.000Z");

describe("parseMalaysiaViewingDateTime", () => {
  it("converts Malaysia wall-clock time to UTC", () => {
    const result = parseMalaysiaViewingDateTime("2026-08-01", "10:30", now);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.scheduledAt.toISOString()).toBe("2026-08-01T02:30:00.000Z");
    }
  });

  it("rejects invalid dates, time increments, and opening hours", () => {
    expect(parseMalaysiaViewingDateTime("2026-02-30", "10:00", now).ok).toBe(false);
    expect(parseMalaysiaViewingDateTime("2026-08-01", "10:15", now).ok).toBe(false);
    expect(parseMalaysiaViewingDateTime("2026-08-01", "18:30", now).ok).toBe(false);
  });

  it("enforces notice and scheduling horizon", () => {
    expect(parseMalaysiaViewingDateTime("2026-07-31", "10:30", now).ok).toBe(false);
    expect(parseMalaysiaViewingDateTime("2027-02-01", "10:00", now).ok).toBe(false);
  });
});

describe("getMalaysiaDateValue", () => {
  it("formats using Malaysia time instead of the runtime timezone", () => {
    expect(getMalaysiaDateValue(new Date("2026-07-31T17:00:00.000Z"))).toBe(
      "2026-08-01",
    );
  });
});
