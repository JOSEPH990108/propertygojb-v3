import "server-only";

import { getSystemSettingNumber } from "@/lib/system-settings";

export const bookingSettingKeys = {
  reservationExpiryDays: "booking.reservation_expiry_days",
  loSignExpiryDays: "booking.lo_sign_expiry_days",
} as const;

export function addDays(value: Date, days: number) {
  const result = new Date(value);
  result.setDate(result.getDate() + days);
  return result;
}

export async function getBookingReservationExpiryDays(): Promise<number> {
  return getSystemSettingNumber(bookingSettingKeys.reservationExpiryDays, 3);
}

export async function getBookingLoSignExpiryDays(): Promise<number> {
  return getSystemSettingNumber(bookingSettingKeys.loSignExpiryDays, 14);
}

export async function getBookingReservationExpiresAt(startAt = new Date()) {
  const expiryDays = await getBookingReservationExpiryDays();

  return addDays(startAt, expiryDays);
}

export async function getBookingLoSignDueAt(startAt = new Date()) {
  const expiryDays = await getBookingLoSignExpiryDays();

  return addDays(startAt, expiryDays);
}
