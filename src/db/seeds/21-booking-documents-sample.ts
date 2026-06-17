import { eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "../schema";

type DB = PostgresJsDatabase<typeof schema>;

const SAMPLE_LEAD_PHONE_NORMALIZED = "601111000003";
const SAMPLE_BOOKING_CODE = "phase1c-sample-booking-001";
const SAMPLE_PAYMENT_REFERENCE = "phase1c-sample-payment-001";
const SAMPLE_VERIFICATION_REASON_NOTE = "Phase 1C sample verification";
const SAMPLE_ACTIVITY_TITLE = "Sample booking payment proof verified";
const SAMPLE_STATUS_REASON_NOTE = "Phase 1C sample status update";

export async function seedBookingDocumentsSample(db: DB) {
  if (process.env.APP_ENV !== "development") {
    return;
  }

  if (process.env.ENABLE_PHASE1C_SAMPLE_BOOKING_DOCUMENTS !== "true") {
    return;
  }

  const source = await db.query.leadSources.findFirst({
    where: (table, { eq: equal }) => equal(table.code, "WEB_FORM"),
  });

  const project = await db.query.projects.findFirst();

  if (!source || !project) {
    return;
  }

  const unit = await db.query.units.findFirst({
    where: (table, { eq: equal }) => equal(table.projectId, project.id),
  });

  if (!unit) {
    return;
  }

  await db
    .insert(schema.leads)
    .values({
      sourceId: source.id,
      fullName: "Phase1C Sample Buyer",
      primaryPhoneE164: "+601111000003",
      primaryPhoneNormalized: SAMPLE_LEAD_PHONE_NORMALIZED,
      email: "phase1c.sample.buyer@example.test",
      currentStatus: "QUALIFIED",
      firstInquiryAt: new Date(),
      metadata: {
        purpose: "phase1c_sample",
      },
    })
    .onConflictDoNothing();

  const lead = await db.query.leads.findFirst({
    where: (table, { eq: equal }) =>
      equal(table.primaryPhoneNormalized, SAMPLE_LEAD_PHONE_NORMALIZED),
  });

  if (!lead) {
    return;
  }

  const [booking] = await db
    .insert(schema.bookings)
    .values({
      leadId: lead.id,
      projectId: project.id,
      bookingCode: SAMPLE_BOOKING_CODE,
      status: "SUBMITTED",
      bookingChannel: "WEBSITE",
      bookingFeeAmount: "1000.00",
      bookingFeePaidAmount: "1000.00",
      bookingFeeCurrency: "MYR",
      submittedAt: new Date(),
      metadata: {
        purpose: "phase1c_sample",
      },
    })
    .onConflictDoUpdate({
      target: schema.bookings.bookingCode,
      set: {
        leadId: lead.id,
        projectId: project.id,
        status: "SUBMITTED",
        bookingChannel: "WEBSITE",
      },
    })
    .returning();

  if (!booking) {
    return;
  }

  await db
    .insert(schema.bookingUnits)
    .values({
      bookingId: booking.id,
      projectId: project.id,
      unitId: unit.id,
      reservationStartedAt: new Date(),
      reservationExpiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000),
    })
    .onConflictDoUpdate({
      target: schema.bookingUnits.bookingId,
      set: {
        projectId: project.id,
        unitId: unit.id,
        reservationExpiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000),
      },
    });

  const [participant] = await db
    .insert(schema.bookingParticipants)
    .values({
      bookingId: booking.id,
      role: "PRIMARY_BUYER",
      fullName: "Phase1C Sample Buyer",
      phoneE164: "+601111000003",
      email: "phase1c.sample.buyer@example.test",
      identityType: "NRIC",
      identityNoMasked: "XXXXXX-XX-0003",
      isPrimaryContact: true,
      isSignatory: true,
      participantOrder: 0,
    })
    .onConflictDoUpdate({
      target: [
        schema.bookingParticipants.bookingId,
        schema.bookingParticipants.participantOrder,
      ],
      set: {
        role: "PRIMARY_BUYER",
        fullName: "Phase1C Sample Buyer",
        isPrimaryContact: true,
        isSignatory: true,
      },
    })
    .returning();

  if (!participant) {
    return;
  }

  const [proofFile] = await db
    .insert(schema.files)
    .values({
      provider: "S3",
      bucket: "dev-sample-documents",
      key: "phase1c/sample-booking-payment-proof-001.pdf",
      url: "https://example.test/files/phase1c/sample-booking-payment-proof-001.pdf",
      mimeType: "application/pdf",
      size: 1024,
      checksum: "phase1c-sample-payment-proof-checksum",
      scanStatus: "CLEAN",
      visibilityScope: "INTERNAL",
    })
    .onConflictDoUpdate({
      target: [schema.files.provider, schema.files.bucket, schema.files.key],
      set: {
        mimeType: "application/pdf",
        size: 1024,
        scanStatus: "CLEAN",
      },
    })
    .returning();

  if (!proofFile) {
    return;
  }

  const existingPayment = await db.query.bookingPayments.findFirst({
    where: (table, { and: andCond, eq: equal }) =>
      andCond(
        equal(table.bookingId, booking.id),
        equal(table.referenceNo, SAMPLE_PAYMENT_REFERENCE),
      ),
  });

  if (!existingPayment) {
    await db.insert(schema.bookingPayments).values({
      bookingId: booking.id,
      paymentType: "BOOKING_FEE",
      amount: "1000.00",
      currency: "MYR",
      paymentMethod: "BANK_TRANSFER",
      paymentStatus: "VERIFIED",
      receivedAt: new Date(),
      verifiedAt: new Date(),
      referenceNo: SAMPLE_PAYMENT_REFERENCE,
      proofFileId: proofFile.id,
    });
  }

  const docTypes = await db.query.documentTypes.findMany({
    where: (table, { inArray }) =>
      inArray(table.code, [
        "NRIC_PASSPORT",
        "PROOF_OF_INCOME",
        "BANK_STATEMENT",
        "BOOKING_PAYMENT_PROOF",
      ]),
  });

  const docTypeByCode = new Map(docTypes.map((row) => [row.code, row]));
  const bookingPaymentProof = docTypeByCode.get("BOOKING_PAYMENT_PROOF");

  if (!bookingPaymentProof) {
    return;
  }

  const [request] = await db
    .insert(schema.documentRequests)
    .values({
      bookingId: booking.id,
      participantId: participant.id,
      documentTypeId: bookingPaymentProof.id,
      requestStatus: "SUBMITTED",
      requestedAt: new Date(),
      notes: "Phase 1C sample request",
    })
    .onConflictDoNothing()
    .returning();

  const docRequest =
    request ??
    (await db.query.documentRequests.findFirst({
      where: (table, { and, eq: equal }) =>
        and(
          equal(table.bookingId, booking.id),
          equal(table.participantId, participant.id),
          equal(table.documentTypeId, bookingPaymentProof.id),
        ),
    }));

  if (!docRequest) {
    return;
  }

  const existingSubmission = await db.query.documentSubmissions.findFirst({
    where: (table, { and: andCond, eq: equal }) =>
      andCond(equal(table.requestId, docRequest.id), equal(table.versionNo, 1)),
  });

  let submission = existingSubmission;

  if (submission) {
    const [updatedSubmission] = await db
      .update(schema.documentSubmissions)
      .set({
        submissionStatus: "VERIFIED",
        fileId: proofFile.id,
      })
      .where(eq(schema.documentSubmissions.id, submission.id))
      .returning();

    submission = updatedSubmission ?? submission;
  } else {
    const [insertedSubmission] = await db
      .insert(schema.documentSubmissions)
      .values({
        bookingId: booking.id,
        requestId: docRequest.id,
        participantId: participant.id,
        documentTypeId: bookingPaymentProof.id,
        fileId: proofFile.id,
        submissionStatus: "VERIFIED",
        uploadedAt: new Date(),
        versionNo: 1,
        notes: "Phase 1C sample submission",
      })
      .returning();

    submission = insertedSubmission;
  }

  if (!submission) {
    return;
  }

  const existingVerificationLog = await db.query.documentVerificationLogs.findFirst({
    where: (table, { and: andCond, eq: equal }) =>
      andCond(
        equal(table.submissionId, submission.id),
        equal(table.reasonNote, SAMPLE_VERIFICATION_REASON_NOTE),
      ),
  });

  if (!existingVerificationLog) {
    await db.insert(schema.documentVerificationLogs).values({
      submissionId: submission.id,
      bookingId: booking.id,
      verificationStatus: "VERIFIED",
      verifiedAt: new Date(),
      reasonNote: SAMPLE_VERIFICATION_REASON_NOTE,
      checklistJson: {
        readable: true,
        complete: true,
      },
    });
  }

  const existingViewLog = await db.query.documentAccessLogs.findFirst({
    where: (table, { and: andCond, eq: equal }) =>
      andCond(
        equal(table.submissionId, submission.id),
        equal(table.accessType, "VIEW"),
        equal(table.sourceContext, "ADMIN_PORTAL"),
      ),
  });

  if (!existingViewLog) {
    await db.insert(schema.documentAccessLogs).values({
      submissionId: submission.id,
      bookingId: booking.id,
      accessType: "VIEW",
      sourceContext: "ADMIN_PORTAL",
    });
  }

  const existingDownloadLog = await db.query.documentAccessLogs.findFirst({
    where: (table, { and: andCond, eq: equal }) =>
      andCond(
        equal(table.submissionId, submission.id),
        equal(table.accessType, "DOWNLOAD"),
        equal(table.sourceContext, "ADMIN_PORTAL"),
      ),
  });

  if (!existingDownloadLog) {
    await db.insert(schema.documentAccessLogs).values({
      submissionId: submission.id,
      bookingId: booking.id,
      accessType: "DOWNLOAD",
      sourceContext: "ADMIN_PORTAL",
    });
  }

  const existingActivity = await db.query.bookingActivities.findFirst({
    where: (table, { and: andCond, eq: equal }) =>
      andCond(equal(table.bookingId, booking.id), equal(table.title, SAMPLE_ACTIVITY_TITLE)),
  });

  if (!existingActivity) {
    await db.insert(schema.bookingActivities).values({
      bookingId: booking.id,
      activityType: "DOCUMENT_VERIFIED",
      title: SAMPLE_ACTIVITY_TITLE,
      body: "Generated by Phase 1C sample seed.",
      visibilityScope: "INTERNAL",
      activityAt: new Date(),
      metadata: {
        seeded: true,
      },
    });
  }

  const existingStatusHistory = await db.query.bookingStatusHistory.findFirst({
    where: (table, { and: andCond, eq: equal }) =>
      andCond(
        equal(table.bookingId, booking.id),
        equal(table.fromStatus, "PAYMENT_PENDING"),
        equal(table.toStatus, "PAYMENT_VERIFIED"),
        equal(table.reasonNote, SAMPLE_STATUS_REASON_NOTE),
      ),
  });

  if (!existingStatusHistory) {
    await db.insert(schema.bookingStatusHistory).values({
      bookingId: booking.id,
      fromStatus: "PAYMENT_PENDING",
      toStatus: "PAYMENT_VERIFIED",
      changedAt: new Date(),
      sourceEventType: "SYSTEM",
      reasonNote: SAMPLE_STATUS_REASON_NOTE,
    });
  }

  await db
    .update(schema.bookings)
    .set({
      bookingFeePaidAmount: "1000.00",
      status: "PAYMENT_VERIFIED",
    })
    .where(eq(schema.bookings.id, booking.id));
}
