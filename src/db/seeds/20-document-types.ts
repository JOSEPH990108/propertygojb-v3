import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "../schema";

type DB = PostgresJsDatabase<typeof schema>;

const baselineDocumentTypes = [
  {
    code: "NRIC_PASSPORT",
    name: "NRIC / Passport",
    category: "IDENTITY",
    isMandatoryDefault: true,
  },
  {
    code: "PROOF_OF_INCOME",
    name: "Proof of Income",
    category: "INCOME",
    isMandatoryDefault: true,
  },
  {
    code: "BANK_STATEMENT",
    name: "Bank Statement",
    category: "FINANCING",
    isMandatoryDefault: true,
  },
  {
    code: "BOOKING_PAYMENT_PROOF",
    name: "Booking Payment Proof",
    category: "FINANCING",
    isMandatoryDefault: true,
  },
] as const;

export async function seedDocumentTypes(db: DB) {
  for (const docType of baselineDocumentTypes) {
    await db
      .insert(schema.documentTypes)
      .values({
        ...docType,
        isActive: true,
      })
      .onConflictDoUpdate({
        target: schema.documentTypes.code,
        set: {
          name: docType.name,
          category: docType.category,
          isMandatoryDefault: docType.isMandatoryDefault,
          isActive: true,
        },
      });
  }
}
