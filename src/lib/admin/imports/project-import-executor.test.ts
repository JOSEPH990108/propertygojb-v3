import { describe, expect, it, vi } from "vitest";

import { resolveUnitBookingStatusId } from "./unit-booking-status";

describe("resolveUnitBookingStatusId", () => {
  it("defaults new unit without booking status to AVAILABLE", async () => {
    const resolveProvidedBookingStatusId = vi.fn(async () => "should-not-be-used");

    const result = await resolveUnitBookingStatusId({
      providedBookingStatus: null,
      existingBookingStatusId: undefined,
      canonicalAvailableBookingStatusId: "booking-available-id",
      resolveProvidedBookingStatusId,
    });

    expect(result).toBe("booking-available-id");
    expect(resolveProvidedBookingStatusId).not.toHaveBeenCalled();
  });

  it("uses explicit booking status when provided for new unit", async () => {
    const resolveProvidedBookingStatusId = vi.fn(async () => "booking-sold-id");

    const result = await resolveUnitBookingStatusId({
      providedBookingStatus: { code: "SOLD", name: "Sold" },
      existingBookingStatusId: undefined,
      canonicalAvailableBookingStatusId: "booking-available-id",
      resolveProvidedBookingStatusId,
    });

    expect(result).toBe("booking-sold-id");
    expect(resolveProvidedBookingStatusId).toHaveBeenCalledOnce();
  });

  it("preserves existing booking status when update omits status", async () => {
    const resolveProvidedBookingStatusId = vi.fn(async () => "should-not-be-used");

    const result = await resolveUnitBookingStatusId({
      providedBookingStatus: undefined,
      existingBookingStatusId: "existing-sold-id",
      canonicalAvailableBookingStatusId: "booking-available-id",
      resolveProvidedBookingStatusId,
    });

    expect(result).toBe("existing-sold-id");
    expect(resolveProvidedBookingStatusId).not.toHaveBeenCalled();
  });

  it("updates existing booking status when explicit status is provided", async () => {
    const resolveProvidedBookingStatusId = vi.fn(async () => "booking-available-id");

    const result = await resolveUnitBookingStatusId({
      providedBookingStatus: { code: "AVAILABLE", name: "Available" },
      existingBookingStatusId: "existing-sold-id",
      canonicalAvailableBookingStatusId: "booking-available-id",
      resolveProvidedBookingStatusId,
    });

    expect(result).toBe("booking-available-id");
    expect(resolveProvidedBookingStatusId).toHaveBeenCalledOnce();
  });

  it("does not overwrite SOLD status to AVAILABLE when omitted on update", async () => {
    const resolveProvidedBookingStatusId = vi.fn(async () => "should-not-be-used");

    const result = await resolveUnitBookingStatusId({
      providedBookingStatus: null,
      existingBookingStatusId: "existing-sold-id",
      canonicalAvailableBookingStatusId: "booking-available-id",
      resolveProvidedBookingStatusId,
    });

    expect(result).toBe("existing-sold-id");
    expect(resolveProvidedBookingStatusId).not.toHaveBeenCalled();
  });
});
