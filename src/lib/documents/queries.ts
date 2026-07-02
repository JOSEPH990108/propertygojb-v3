import "server-only";

import { and, desc, eq, isNull } from "drizzle-orm";

import { db, schema } from "@/db";

export async function getDocumentRequestDetailById(requestId: string) {
  const requestRows = await db
    .select({
      requestId: schema.documentRequests.id,
      bookingId: schema.documentRequests.bookingId,
      participantId: schema.documentRequests.participantId,
      requestStatus: schema.documentRequests.requestStatus,
      requestedAt: schema.documentRequests.requestedAt,
      dueAt: schema.documentRequests.dueAt,
      notes: schema.documentRequests.notes,

      documentTypeId: schema.documentTypes.id,
      documentTypeCode: schema.documentTypes.code,
      documentTypeName: schema.documentTypes.name,
      documentCategory: schema.documentTypes.category,
      isMandatoryDefault: schema.documentTypes.isMandatoryDefault,

      bookingCode: schema.bookings.bookingCode,
      bookingStatus: schema.bookings.status,
      assignedAgentUserId: schema.bookings.assignedAgentUserId,
      bookingFeeAmount: schema.bookings.bookingFeeAmount,
      bookingFeeCurrency: schema.bookings.bookingFeeCurrency,
      bookingFeePaidAmount: schema.bookings.bookingFeePaidAmount,

      leadId: schema.leads.id,
      customerName: schema.leads.fullName,
      customerPhone: schema.leads.primaryPhoneE164,
      customerEmail: schema.leads.email,
      leadStatus: schema.leads.currentStatus,

      projectId: schema.projects.id,
      projectName: schema.projects.name,
      projectDisplayName: schema.projects.displayName,
      projectSlug: schema.projects.slug,

      participantName: schema.bookingParticipants.fullName,
      participantRole: schema.bookingParticipants.role,
      participantPhone: schema.bookingParticipants.phoneE164,
      participantEmail: schema.bookingParticipants.email,
      participantIdentityType: schema.bookingParticipants.identityType,
      participantIdentityNoMasked: schema.bookingParticipants.identityNoMasked,
    })
    .from(schema.documentRequests)
    .innerJoin(
      schema.documentTypes,
      eq(schema.documentRequests.documentTypeId, schema.documentTypes.id),
    )
    .innerJoin(schema.bookings, eq(schema.documentRequests.bookingId, schema.bookings.id))
    .innerJoin(schema.leads, eq(schema.bookings.leadId, schema.leads.id))
    .innerJoin(schema.projects, eq(schema.bookings.projectId, schema.projects.id))
    .leftJoin(
      schema.bookingParticipants,
      eq(schema.documentRequests.participantId, schema.bookingParticipants.id),
    )
    .where(
      and(
        eq(schema.documentRequests.id, requestId),
        isNull(schema.documentRequests.deletedAt),
        isNull(schema.bookings.deletedAt),
      ),
    )
    .limit(1);

  const request = requestRows[0];

  if (!request) {
    return null;
  }

  const [submissions, verificationLogs] = await Promise.all([
    db
      .select({
        id: schema.documentSubmissions.id,
        submissionStatus: schema.documentSubmissions.submissionStatus,
        uploadedAt: schema.documentSubmissions.uploadedAt,
        versionNo: schema.documentSubmissions.versionNo,
        notes: schema.documentSubmissions.notes,
        fileId: schema.documentSubmissions.fileId,
        uploadedByUserId: schema.documentSubmissions.uploadedByUserId,
        createdAt: schema.documentSubmissions.createdAt,

        fileUrl: schema.files.url,
        fileKey: schema.files.key,
        fileMimeType: schema.files.mimeType,
        fileSize: schema.files.size,
      })
      .from(schema.documentSubmissions)
      .leftJoin(schema.files, eq(schema.documentSubmissions.fileId, schema.files.id))
      .where(
        and(
          eq(schema.documentSubmissions.requestId, requestId),
          isNull(schema.documentSubmissions.deletedAt),
        ),
      )
      .orderBy(desc(schema.documentSubmissions.versionNo), desc(schema.documentSubmissions.createdAt)),

    db
      .select({
        id: schema.documentVerificationLogs.id,
        submissionId: schema.documentVerificationLogs.submissionId,
        verificationStatus: schema.documentVerificationLogs.verificationStatus,
        verifiedAt: schema.documentVerificationLogs.verifiedAt,
        verifiedByUserId: schema.documentVerificationLogs.verifiedByUserId,
        reasonCode: schema.documentVerificationLogs.reasonCode,
        reasonNote: schema.documentVerificationLogs.reasonNote,
        createdAt: schema.documentVerificationLogs.createdAt,
      })
      .from(schema.documentVerificationLogs)
      .innerJoin(
        schema.documentSubmissions,
        eq(schema.documentVerificationLogs.submissionId, schema.documentSubmissions.id),
      )
      .where(
        and(
          eq(schema.documentSubmissions.requestId, requestId),
          isNull(schema.documentVerificationLogs.deletedAt),
        ),
      )
      .orderBy(desc(schema.documentVerificationLogs.verifiedAt)),
  ]);

  return {
    request,
    submissions,
    verificationLogs,
  };
}
