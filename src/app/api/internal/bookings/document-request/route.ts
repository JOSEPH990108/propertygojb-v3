import { and, eq, isNull } from "drizzle-orm";
import { NextRequest } from "next/server";
import { z } from "zod";

import { db, schema } from "@/db";
import { errorJson, okJson, parseApiError } from "@/lib/api/json";
import { requireRole } from "@/lib/auth/guards";

const createDocumentRequestSchema = z.object({
  bookingId: z.string().min(1, "Booking is required."),
  documentTypeId: z.string().min(1, "Document type is required."),
  participantId: z.string().trim().optional().default(""),
  dueAt: z.string().trim().optional().default(""),
  notes: z.string().trim().max(2000).optional().default(""),
});

const bookingStatusOptions = [
  "DRAFT",
  "SUBMITTED",
  "UNDER_REVIEW",
  "PAYMENT_PENDING",
  "PAYMENT_VERIFIED",
  "DOCS_PENDING",
  "DOCS_VERIFIED",
  "APPROVED",
  "REJECTED",
  "EXPIRED",
  "CANCELLED",
] as const;

type BookingStatus = (typeof bookingStatusOptions)[number];

function isBookingStatus(value: string): value is BookingStatus {
  return bookingStatusOptions.includes(value as BookingStatus);
}

function normalizeBookingStatus(value: string): BookingStatus {
  return isBookingStatus(value) ? value : "DRAFT";
}

function parseDueAt(value: string) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

function getNextBookingStatus(currentStatus: string): BookingStatus {
  const normalizedStatus = normalizeBookingStatus(currentStatus);

  if (["APPROVED", "REJECTED", "EXPIRED", "CANCELLED"].includes(normalizedStatus)) {
    return normalizedStatus;
  }

  if (normalizedStatus === "DOCS_VERIFIED") {
    return normalizedStatus;
  }

  return "DOCS_PENDING";
}

export async function POST(request: NextRequest) {
  try {
    const authContext = await requireRole(
      ["ADMIN", "SUPER_ADMIN"],
      "/admin/bookings",
    );

    const currentUser = authContext.user as { id?: unknown };
    const currentUserId = typeof currentUser.id === "string" ? currentUser.id : "";

    if (!currentUserId) {
      return errorJson("Current user not found.", 401);
    }

    const body = await request.json();
    const validated = createDocumentRequestSchema.parse(body);
    const participantId = validated.participantId || null;
    const dueAt = parseDueAt(validated.dueAt);

    const booking = await db.query.bookings.findFirst({
      where: (table, { and, eq, isNull }) =>
        and(eq(table.id, validated.bookingId), isNull(table.deletedAt)),
      columns: {
        id: true,
        bookingCode: true,
        leadId: true,
        status: true,
      },
    });

    if (!booking) {
      return errorJson("Booking not found.", 404);
    }

    if (["REJECTED", "EXPIRED", "CANCELLED"].includes(booking.status)) {
      return errorJson("Document request cannot be added to inactive booking.", 400);
    }

    const documentType = await db.query.documentTypes.findFirst({
      where: (table, { and, eq, isNull }) =>
        and(
          eq(table.id, validated.documentTypeId),
          eq(table.isActive, true),
          isNull(table.deletedAt),
        ),
      columns: {
        id: true,
        code: true,
        name: true,
      },
    });

    if (!documentType) {
      return errorJson("Document type not found.", 404);
    }

    if (participantId) {
      const participant = await db.query.bookingParticipants.findFirst({
        where: (table, { and, eq, isNull }) =>
          and(
            eq(table.id, participantId),
            eq(table.bookingId, booking.id),
            isNull(table.deletedAt),
          ),
        columns: {
          id: true,
        },
      });

      if (!participant) {
        return errorJson("Participant not found for this booking.", 404);
      }
    }

    const existingRequests = await db
      .select({
        id: schema.documentRequests.id,
        participantId: schema.documentRequests.participantId,
        requestStatus: schema.documentRequests.requestStatus,
      })
      .from(schema.documentRequests)
      .where(
        and(
          eq(schema.documentRequests.bookingId, booking.id),
          eq(schema.documentRequests.documentTypeId, documentType.id),
          isNull(schema.documentRequests.deletedAt),
        ),
      );

    const existingOpenRequest = existingRequests.find(
      (item) =>
        item.participantId === participantId && item.requestStatus !== "WAIVED",
    );

    if (existingOpenRequest) {
      return errorJson("This document has already been requested.", 400);
    }

    const now = new Date();
    const nextStatus = getNextBookingStatus(booking.status);

    const created = await db.transaction(async (tx) => {
      const insertedRequests = await tx
        .insert(schema.documentRequests)
        .values({
          bookingId: booking.id,
          participantId,
          documentTypeId: documentType.id,
          requestStatus: "REQUESTED",
          requestedByUserId: currentUserId,
          requestedAt: now,
          dueAt,
          notes: validated.notes || null,
        })
        .returning({
          id: schema.documentRequests.id,
        });

      const documentRequest = insertedRequests[0];

      if (!documentRequest) {
        throw new Error("Failed to create document request.");
      }

      if (booking.status !== nextStatus) {
        await tx
          .update(schema.bookings)
          .set({
            status: nextStatus,
            updatedAt: now,
          })
          .where(eq(schema.bookings.id, booking.id));

        await tx.insert(schema.bookingStatusHistory).values({
          bookingId: booking.id,
          fromStatus: booking.status,
          toStatus: nextStatus,
          changedByUserId: currentUserId,
          changedAt: now,
          reasonCode: "DOCUMENT_REQUESTED",
          reasonNote: validated.notes || null,
          sourceEventType: "DOCUMENT_REQUEST",
        });
      }

      await tx.insert(schema.bookingActivities).values({
        bookingId: booking.id,
        actorUserId: currentUserId,
        activityType: "DOCUMENT_REQUESTED",
        title: "Document requested",
        body: `${documentType.name} was requested.`,
        visibilityScope: "INTERNAL",
        activityAt: now,
        metadata: {
          documentRequestId: documentRequest.id,
          documentTypeId: documentType.id,
          documentTypeCode: documentType.code,
          documentTypeName: documentType.name,
          participantId,
          dueAt: dueAt?.toISOString() ?? null,
          notes: validated.notes || null,
        },
      });

      if (booking.leadId) {
        await tx.insert(schema.leadActivities).values({
          leadId: booking.leadId,
          actorUserId: currentUserId,
          activityType: "DOCUMENT_REQUESTED",
          title: "Document requested",
          body: `${documentType.name} requested for booking ${booking.bookingCode}.`,
          visibilityScope: "INTERNAL",
          metadata: {
            bookingId: booking.id,
            bookingCode: booking.bookingCode,
            documentRequestId: documentRequest.id,
            documentTypeId: documentType.id,
            documentTypeName: documentType.name,
          },
        });
      }

      return documentRequest;
    });

    return okJson({
      message: "Document request created successfully.",
      documentRequestId: created.id,
      bookingId: booking.id,
      bookingCode: booking.bookingCode,
      status: nextStatus,
    });
  } catch (error) {
    return errorJson(parseApiError(error));
  }
}
