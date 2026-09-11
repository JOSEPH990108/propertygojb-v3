export const VIEWING_TIME_ZONE = "Asia/Kuala_Lumpur";
export const VIEWING_OPENING_HOUR = 9;
export const VIEWING_CLOSING_HOUR = 18;
export const VIEWING_MAX_DAYS_AHEAD = 180;

type ViewingDateTimeResult =
  | { ok: true; scheduledAt: Date }
  | { ok: false; message: string };

export function getMalaysiaDateValue(value = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: VIEWING_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(value);
  const getPart = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return `${getPart("year")}-${getPart("month")}-${getPart("day")}`;
}

/** Converts a Malaysia wall-clock preference to an absolute instant. */
export function parseMalaysiaViewingDateTime(
  dateValue: string,
  timeValue: string,
  now = new Date(),
): ViewingDateTimeResult {
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateValue);
  const timeMatch = /^(\d{2}):(\d{2})$/.exec(timeValue);

  if (!dateMatch || !timeMatch) {
    return { ok: false, message: "Choose a valid viewing date and time." };
  }

  const [, yearText, monthText, dayText] = dateMatch;
  const [, hourText, minuteText] = timeMatch;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const hour = Number(hourText);
  const minute = Number(minuteText);
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();

  if (month < 1 || month > 12 || day < 1 || day > daysInMonth) {
    return { ok: false, message: "Choose a valid viewing date." };
  }

  if (
    hour < VIEWING_OPENING_HOUR ||
    hour > VIEWING_CLOSING_HOUR ||
    (hour === VIEWING_CLOSING_HOUR && minute > 0) ||
    ![0, 30].includes(minute)
  ) {
    return {
      ok: false,
      message: "Choose a 30-minute time between 9:00 AM and 6:00 PM Malaysia time.",
    };
  }

  const scheduledAt = new Date(
    `${dateValue}T${timeValue}:00+08:00`,
  );

  if (Number.isNaN(scheduledAt.getTime())) {
    return { ok: false, message: "Choose a valid viewing date and time." };
  }

  const minimumNoticeAt = new Date(now.getTime() + 60 * 60 * 1000);
  const maximumDate = new Date(
    now.getTime() + VIEWING_MAX_DAYS_AHEAD * 24 * 60 * 60 * 1000,
  );

  if (scheduledAt < minimumNoticeAt) {
    return { ok: false, message: "Choose a viewing time at least one hour from now." };
  }

  if (scheduledAt > maximumDate) {
    return {
      ok: false,
      message: `Choose a viewing date within ${VIEWING_MAX_DAYS_AHEAD} days.`,
    };
  }

  return { ok: true, scheduledAt };
}
