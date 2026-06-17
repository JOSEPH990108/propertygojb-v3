import { loadEnvConfig } from "@next/env"
import { and, eq } from "drizzle-orm"
import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"

import { roles, user } from "../schema/identity-auth"

type InternalRoleCode = "AGENT" | "ADMIN" | "SUPER_ADMIN"

type CliOptions = {
  email?: string
  phone?: string
  role?: string
}

function parseCliOptions(argv: string[]): CliOptions {
  const options: CliOptions = {}

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index]
    const nextToken = argv[index + 1]

    if ((token === "--email" || token === "-e") && nextToken) {
      options.email = nextToken
      index += 1
      continue
    }

    if ((token === "--phone" || token === "-p") && nextToken) {
      options.phone = nextToken
      index += 1
      continue
    }

    if ((token === "--role" || token === "-r") && nextToken) {
      options.role = nextToken
      index += 1
    }
  }

  return options
}

function resolveAppEnv(): string {
  return (process.env.APP_ENV ?? process.env.NODE_ENV ?? "").trim().toLowerCase()
}

function normalizeRoleCode(value: string | undefined): InternalRoleCode {
  const normalized = (value ?? "").trim().toUpperCase()
  if (normalized === "AGENT" || normalized === "ADMIN" || normalized === "SUPER_ADMIN") {
    return normalized
  }

  throw new Error("TARGET_ROLE must be one of: AGENT, ADMIN, SUPER_ADMIN.")
}

function asNonEmpty(value: string | undefined): string | undefined {
  if (!value) {
    return undefined
  }

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

async function main() {
  loadEnvConfig(process.cwd())

  const appEnv = resolveAppEnv()
  if (appEnv !== "development") {
    throw new Error("Provisioning is allowed only when APP_ENV is development.")
  }

  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is missing.")
  }

  const cliOptions = parseCliOptions(process.argv.slice(2))

  const email = asNonEmpty(cliOptions.email ?? process.env.TARGET_USER_EMAIL)
  const phone = asNonEmpty(cliOptions.phone ?? process.env.TARGET_USER_PHONE)
  const targetRole = normalizeRoleCode(cliOptions.role ?? process.env.TARGET_ROLE)

  if (!email && !phone) {
    throw new Error("Provide TARGET_USER_EMAIL or TARGET_USER_PHONE (or --email/--phone).")
  }

  if (targetRole === "SUPER_ADMIN" && process.env.CONFIRM_SUPER_ADMIN !== "true") {
    throw new Error("SUPER_ADMIN assignment requires CONFIRM_SUPER_ADMIN=true.")
  }

  const client = postgres(databaseUrl, { max: 1 })

  try {
    const db = drizzle(client)

    const whereClause = email && phone
      ? and(eq(user.email, email), eq(user.phoneNumber, phone))
      : email
        ? eq(user.email, email)
        : eq(user.phoneNumber, phone as string)

    const matchedUser = await db
      .select({
        id: user.id,
      })
      .from(user)
      .where(whereClause)
      .limit(1)

    if (matchedUser.length === 0) {
      throw new Error("No matching user found for the provided identifier.")
    }

    const roleRecord = await db
      .select({
        id: roles.id,
      })
      .from(roles)
      .where(eq(roles.code, targetRole))
      .limit(1)

    if (roleRecord.length === 0) {
      throw new Error(`Role ${targetRole} not found in roles table.`)
    }

    await db
      .update(user)
      .set({
        roleId: roleRecord[0].id,
      })
      .where(eq(user.id, matchedUser[0].id))

    // Dev-only helper. Production role changes must use an audited admin workflow.
    console.log(`SUCCESS userId=${matchedUser[0].id} targetRole=${targetRole}`)
  } finally {
    await client.end()
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown provisioning error."
  console.error(`FAILED ${message}`)
  process.exit(1)
})
