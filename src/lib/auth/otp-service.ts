import "server-only";

import { createHmac, randomInt, randomUUID, timingSafeEqual } from "crypto";
import { and, eq, isNull } from "drizzle-orm";

import { db, schema } from "@/db";

export type AuthOtpPurpose = "REGISTER" | "PASSWORD_RESET";

const OTP_EXPIRES_SECONDS = 300;
const OTP_RESEND_SECONDS = 60;
const OTP_MAX_ATTEMPTS = 5;

function getOtpSecret() {
  const secret = process.env.BETTER_AUTH_SECRET;

  if (!secret) {
    throw new Error("BETTER_AUTH_SECRET is required.");
  }

  return secret;
}

function generateOtpCode() {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

function hashOtpCode(phoneNumber: string, purpose: AuthOtpPurpose, code: string) {
  return createHmac("sha256", getOtpSecret())
    .update(`${purpose}:${phoneNumber}:${code}`)
    .digest("hex");
}

function safeCompare(leftValue: string, rightValue: string) {
  const left = Buffer.from(leftValue);
  const right = Buffer.from(rightValue);

  if (left.length !== right.length) {
    return false;
  }

  return timingSafeEqual(left, right);
}

async function closeActiveChallenges(
  phoneNormalized: string,
  purpose: AuthOtpPurpose,
) {
  await db
    .update(schema.otpChallenges)
    .set({
      consumedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(schema.otpChallenges.phoneNormalized, phoneNormalized),
        eq(schema.otpChallenges.purpose, purpose),
        isNull(schema.otpChallenges.consumedAt),
        isNull(schema.otpChallenges.lockedAt),
      ),
    );
}

export async function createAuthOtpChallenge(params: {
  phoneNumber: string;
  phoneNormalized: string;
  purpose: AuthOtpPurpose;
  userId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const now = new Date();
  const code = generateOtpCode();
  const expiresAt = new Date(now.getTime() + OTP_EXPIRES_SECONDS * 1000);
  const resendAvailableAt = new Date(now.getTime() + OTP_RESEND_SECONDS * 1000);

  await closeActiveChallenges(params.phoneNormalized, params.purpose);

  await db.insert(schema.otpChallenges).values({
    identifier: `${params.purpose}:${params.phoneNumber}:${randomUUID()}`,
    phoneE164: params.phoneNumber,
    phoneNormalized: params.phoneNormalized,
    purpose: params.purpose,
    channel: "DEV_CONSOLE",
    otpHash: hashOtpCode(params.phoneNumber, params.purpose, code),
    expiresAt,
    resendAvailableAt,
    lastSentAt: now,
    sendCount: 1,
    maxAttempts: OTP_MAX_ATTEMPTS,
    userId: params.userId ?? null,
    metadata: params.metadata ?? {},
  });

  console.log(`[DEV ${params.purpose} OTP] ${params.phoneNumber}: ${code}`);

  return {
    expiresAt,
    resendAvailableAt,
  };
}

export async function verifyAuthOtpChallenge(params: {
  phoneNumber: string;
  phoneNormalized: string;
  purpose: AuthOtpPurpose;
  code: string;
}) {
  const now = new Date();

  const challenge = await db.query.otpChallenges.findFirst({
    where: (table, { and, eq, isNull }) =>
      and(
        eq(table.phoneNormalized, params.phoneNormalized),
        eq(table.purpose, params.purpose),
        isNull(table.consumedAt),
        isNull(table.lockedAt),
      ),
    orderBy: (table, { desc }) => [desc(table.createdAt)],
  });

  if (!challenge) {
    return {
      ok: false as const,
      message: "OTP not found. Please request a new code.",
    };
  }

  if (challenge.expiresAt.getTime() <= now.getTime()) {
    await db
      .update(schema.otpChallenges)
      .set({
        lockedAt: now,
        updatedAt: now,
      })
      .where(eq(schema.otpChallenges.id, challenge.id));

    return {
      ok: false as const,
      message: "OTP expired. Please request a new code.",
    };
  }

  if (challenge.attemptCount >= challenge.maxAttempts) {
    await db
      .update(schema.otpChallenges)
      .set({
        lockedAt: now,
        updatedAt: now,
      })
      .where(eq(schema.otpChallenges.id, challenge.id));

    return {
      ok: false as const,
      message: "Too many invalid attempts. Please request a new code.",
    };
  }

  const expectedHash = hashOtpCode(
    params.phoneNumber,
    params.purpose,
    params.code,
  );

  if (!safeCompare(expectedHash, challenge.otpHash)) {
    const nextAttemptCount = challenge.attemptCount + 1;

    await db
      .update(schema.otpChallenges)
      .set({
        attemptCount: nextAttemptCount,
        lockedAt: nextAttemptCount >= challenge.maxAttempts ? now : null,
        updatedAt: now,
      })
      .where(eq(schema.otpChallenges.id, challenge.id));

    return {
      ok: false as const,
      message: "Invalid OTP code.",
    };
  }

  await db
    .update(schema.otpChallenges)
    .set({
      verifiedAt: now,
      updatedAt: now,
    })
    .where(eq(schema.otpChallenges.id, challenge.id));

  return {
    ok: true as const,
    challengeId: challenge.id,
  };
}

export async function getVerifiedAuthOtpChallenge(params: {
  challengeId: string;
  phoneNormalized: string;
  purpose: AuthOtpPurpose;
}) {
  const now = new Date();

  const challenge = await db.query.otpChallenges.findFirst({
    where: (table, { and, eq, isNull, isNotNull }) =>
      and(
        eq(table.id, params.challengeId),
        eq(table.phoneNormalized, params.phoneNormalized),
        eq(table.purpose, params.purpose),
        isNotNull(table.verifiedAt),
        isNull(table.consumedAt),
        isNull(table.lockedAt),
      ),
  });

  if (!challenge || challenge.expiresAt.getTime() <= now.getTime()) {
    return null;
  }

  return challenge;
}

export async function consumeAuthOtpChallenge(challengeId: string) {
  await db
    .update(schema.otpChallenges)
    .set({
      consumedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(schema.otpChallenges.id, challengeId));
}
