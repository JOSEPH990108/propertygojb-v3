import type { LookupRef } from "./project-import-schema";

type ResolveUnitBookingStatusIdInput = {
  providedBookingStatus: LookupRef | null | undefined;
  existingBookingStatusId: string | undefined;
  canonicalAvailableBookingStatusId: string;
  resolveProvidedBookingStatusId: (ref: LookupRef) => Promise<string>;
};

export async function resolveUnitBookingStatusId({
  providedBookingStatus,
  existingBookingStatusId,
  canonicalAvailableBookingStatusId,
  resolveProvidedBookingStatusId,
}: ResolveUnitBookingStatusIdInput) {
  if (providedBookingStatus) {
    return resolveProvidedBookingStatusId(providedBookingStatus);
  }

  // Existing unit: preserve current status when input omits bookingStatus.
  if (existingBookingStatusId !== undefined) {
    return existingBookingStatusId;
  }

  // New unit: default to canonical AVAILABLE when bookingStatus is omitted.
  return canonicalAvailableBookingStatusId;
}
