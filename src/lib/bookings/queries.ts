import "server-only";

import { and, asc, desc, eq, isNull } from "drizzle-orm";

import { db, schema } from "@/db";

export async function getBookingDetailById(bookingId: string) {
  const bookingRows = await db
    .select({
      id: schema.bookings.id,
      leadId: schema.bookings.leadId,
      projectId: schema.bookings.projectId,
      bookingCode: schema.bookings.bookingCode,
      status: schema.bookings.status,
      bookingChannel: schema.bookings.bookingChannel,
      submittedByUserId: schema.bookings.submittedByUserId,
      assignedAgentUserId: schema.bookings.assignedAgentUserId,
      bookingFeeAmount: schema.bookings.bookingFeeAmount,
      bookingFeeCurrency: schema.bookings.bookingFeeCurrency,
      bookingFeePaidAmount: schema.bookings.bookingFeePaidAmount,
      bookingFeeDueAt: schema.bookings.bookingFeeDueAt,
      submittedAt: schema.bookings.submittedAt,
      approvedAt: schema.bookings.approvedAt,
      rejectedAt: schema.bookings.rejectedAt,
      rejectionReason: schema.bookings.rejectionReason,
      expiredAt: schema.bookings.expiredAt,
      cancelledAt: schema.bookings.cancelledAt,
      cancellationReason: schema.bookings.cancellationReason,
      metadata: schema.bookings.metadata,
      createdAt: schema.bookings.createdAt,
      updatedAt: schema.bookings.updatedAt,

      customerName: schema.leads.fullName,
      customerPhone: schema.leads.primaryPhoneE164,
      customerEmail: schema.leads.email,

      projectName: schema.projects.name,
      projectDisplayName: schema.projects.displayName,
      projectSlug: schema.projects.slug,
      projectAddress: schema.projects.address,

      agentName: schema.user.name,
      agentEmail: schema.user.email,
    })
    .from(schema.bookings)
    .leftJoin(schema.leads, eq(schema.bookings.leadId, schema.leads.id))
    .leftJoin(schema.projects, eq(schema.bookings.projectId, schema.projects.id))
    .leftJoin(
      schema.user,
      eq(schema.bookings.assignedAgentUserId, schema.user.id),
    )
    .where(and(eq(schema.bookings.id, bookingId), isNull(schema.bookings.deletedAt)))
    .limit(1);

  const booking = bookingRows[0];

  if (!booking) {
    return null;
  }

  const [
    units,
    participants,
    payments,
    documentRequests,
    statusHistory,
    activities,
  ] = await Promise.all([
      db
        .select({
          id: schema.bookingUnits.id,
          unitId: schema.bookingUnits.unitId,
          reservedPrice: schema.bookingUnits.reservedPrice,
          bookingFeeAllocatedAmount:
            schema.bookingUnits.bookingFeeAllocatedAmount,
          reservationStartedAt: schema.bookingUnits.reservationStartedAt,
          reservationExpiresAt: schema.bookingUnits.reservationExpiresAt,
          releasedAt: schema.bookingUnits.releasedAt,
          releaseReason: schema.bookingUnits.releaseReason,

          unitNo: schema.units.unitNo,
          floor: schema.units.floor,
          stack: schema.units.stack,
          streetName: schema.units.streetName,
          builtUpSqft: schema.units.builtUpSqft,
          landAreaSqft: schema.units.landAreaSqft,
          dimensionText: schema.units.dimensionText,
          facing: schema.units.facing,
          carparkCount: schema.units.carparkCount,
          basePrice: schema.units.basePrice,
          finalPrice: schema.units.finalPrice,
        })
        .from(schema.bookingUnits)
        .leftJoin(schema.units, eq(schema.bookingUnits.unitId, schema.units.id))
        .where(
          and(
            eq(schema.bookingUnits.bookingId, bookingId),
            isNull(schema.bookingUnits.deletedAt),
          ),
        )
        .orderBy(asc(schema.units.unitNo)),

      db
        .select({
          id: schema.bookingParticipants.id,
          role: schema.bookingParticipants.role,
          fullName: schema.bookingParticipants.fullName,
          phoneE164: schema.bookingParticipants.phoneE164,
          email: schema.bookingParticipants.email,
          nationality: schema.bookingParticipants.nationality,
          identityType: schema.bookingParticipants.identityType,
          identityNoMasked: schema.bookingParticipants.identityNoMasked,
          isPrimaryContact: schema.bookingParticipants.isPrimaryContact,
          isSignatory: schema.bookingParticipants.isSignatory,
          participantOrder: schema.bookingParticipants.participantOrder,
        })
        .from(schema.bookingParticipants)
        .where(
          and(
            eq(schema.bookingParticipants.bookingId, bookingId),
            isNull(schema.bookingParticipants.deletedAt),
          ),
        )
        .orderBy(asc(schema.bookingParticipants.participantOrder)),

      db
        .select({
          id: schema.bookingPayments.id,
          paymentType: schema.bookingPayments.paymentType,
          amount: schema.bookingPayments.amount,
          currency: schema.bookingPayments.currency,
          paymentMethod: schema.bookingPayments.paymentMethod,
          paymentStatus: schema.bookingPayments.paymentStatus,
          receivedAt: schema.bookingPayments.receivedAt,
          verifiedAt: schema.bookingPayments.verifiedAt,
          referenceNo: schema.bookingPayments.referenceNo,
          proofFileId: schema.bookingPayments.proofFileId,
          rejectionReason: schema.bookingPayments.rejectionReason,
          reasonCode: schema.bookingPayments.reasonCode,
          reasonNote: schema.bookingPayments.reasonNote,
          metadata: schema.bookingPayments.metadata,
          createdAt: schema.bookingPayments.createdAt,
        })
        .from(schema.bookingPayments)
        .where(
          and(
            eq(schema.bookingPayments.bookingId, bookingId),
            isNull(schema.bookingPayments.deletedAt),
          ),
        )
        .orderBy(desc(schema.bookingPayments.createdAt)),

      db
        .select({
          id: schema.documentRequests.id,
          requestStatus: schema.documentRequests.requestStatus,
          requestedAt: schema.documentRequests.requestedAt,
          dueAt: schema.documentRequests.dueAt,
          notes: schema.documentRequests.notes,

          documentTypeId: schema.documentTypes.id,
          documentTypeCode: schema.documentTypes.code,
          documentTypeName: schema.documentTypes.name,
          documentCategory: schema.documentTypes.category,
          isMandatoryDefault: schema.documentTypes.isMandatoryDefault,
        })
        .from(schema.documentRequests)
        .innerJoin(
          schema.documentTypes,
          eq(schema.documentRequests.documentTypeId, schema.documentTypes.id),
        )
        .where(
          and(
            eq(schema.documentRequests.bookingId, bookingId),
            isNull(schema.documentRequests.deletedAt),
          ),
        )
        .orderBy(
          asc(schema.documentTypes.category),
          asc(schema.documentTypes.name),
        ),

      db
        .select({
          id: schema.bookingStatusHistory.id,
          fromStatus: schema.bookingStatusHistory.fromStatus,
          toStatus: schema.bookingStatusHistory.toStatus,
          changedAt: schema.bookingStatusHistory.changedAt,
          reasonCode: schema.bookingStatusHistory.reasonCode,
          reasonNote: schema.bookingStatusHistory.reasonNote,
          sourceEventType: schema.bookingStatusHistory.sourceEventType,
        })
        .from(schema.bookingStatusHistory)
        .where(
          and(
            eq(schema.bookingStatusHistory.bookingId, bookingId),
            isNull(schema.bookingStatusHistory.deletedAt),
          ),
        )
        .orderBy(desc(schema.bookingStatusHistory.changedAt)),

      db
        .select({
          id: schema.bookingActivities.id,
          activityType: schema.bookingActivities.activityType,
          title: schema.bookingActivities.title,
          body: schema.bookingActivities.body,
          visibilityScope: schema.bookingActivities.visibilityScope,
          activityAt: schema.bookingActivities.activityAt,
          metadata: schema.bookingActivities.metadata,
          createdAt: schema.bookingActivities.createdAt,
        })
        .from(schema.bookingActivities)
        .where(
          and(
            eq(schema.bookingActivities.bookingId, bookingId),
            isNull(schema.bookingActivities.deletedAt),
          ),
        )
        .orderBy(desc(schema.bookingActivities.activityAt))
        .limit(80),
    ]);

  return {
    booking,
    units,
    participants,
    payments,
    documentRequests,
    statusHistory,
    activities,
  };
}

export async function getActiveDocumentTypes() {
  return db
    .select({
      id: schema.documentTypes.id,
      code: schema.documentTypes.code,
      name: schema.documentTypes.name,
      category: schema.documentTypes.category,
      isMandatoryDefault: schema.documentTypes.isMandatoryDefault,
    })
    .from(schema.documentTypes)
    .where(
      and(
        eq(schema.documentTypes.isActive, true),
        isNull(schema.documentTypes.deletedAt),
      ),
    )
    .orderBy(asc(schema.documentTypes.category), asc(schema.documentTypes.name));
}

