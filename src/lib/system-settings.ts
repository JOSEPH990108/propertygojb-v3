import "server-only";

import { db } from "@/db";

function getCurrentEnvironment() {
  return process.env.APP_ENV ?? process.env.NODE_ENV ?? "development";
}

export async function getSystemSettingValue(key: string): Promise<unknown | null> {
  const currentEnvironment = getCurrentEnvironment();

  const exactMatch = await db.query.systemSettings.findFirst({
    where: (table, { and, eq, isNull }) =>
      and(
        eq(table.key, key),
        eq(table.environment, currentEnvironment),
        eq(table.isActive, true),
        isNull(table.deletedAt),
      ),
    columns: {
      valueJson: true,
    },
  });

  if (exactMatch) {
    return exactMatch.valueJson;
  }

  const globalMatch = await db.query.systemSettings.findFirst({
    where: (table, { and, eq, isNull }) =>
      and(
        eq(table.key, key),
        eq(table.environment, "ALL"),
        eq(table.isActive, true),
        isNull(table.deletedAt),
      ),
    columns: {
      valueJson: true,
    },
  });

  return globalMatch?.valueJson ?? null;
}

export async function getSystemSettingNumber(
  key: string,
  fallback: number,
): Promise<number> {
  const value = await getSystemSettingValue(key);

  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value)
        : Number.NaN;

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}
