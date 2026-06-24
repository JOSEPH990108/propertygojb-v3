import { and, eq, isNull } from "drizzle-orm";
import { NextRequest } from "next/server";
import { z } from "zod";

import { db, schema } from "@/db";
import { errorJson, okJson, parseApiError } from "@/lib/api/json";
import { requireRole } from "@/lib/auth/guards";

const documentVerificationActionSchema = z.object({
  requestId: z.string().min(1, "Document request is required."),
  submissionId: z.string().trim().optional().default(""),
  action: z.enum(["UNDER_REVIEW", "VERIFY", "REJECT", "WAIVE"]),
  reasonNote: z.string().trim().max(2000).optional().default(""),
});

type DocumentRequestStatus =
  | "REQUESTED"
  | "SUBMITTED"
  | "VERIFIED"
  | "REJECTED"
  | "WAIVED";

type DocumentSubmissionStatus =
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "VERIFIED"
  | "REJECTED"
  | "REPLACED";

type DocumentVerificationStatus = "PENDING" | "VERIFIED" | "REJECTED";

function getActionConfig(action: "UNDER_REVIEW" | "VERIFY" | "REJECT" | "WAIVE") {
  switch (action) {
    case "UNDER_REVIEW":
      return {
        requestStatus: "SUBMITTED" as DocumentRequestStatus,
        submissionStatus: "UNDER_REVIEW" as DocumentSubmissionStatus,
        verificationStatus: "PENDING" as DocumentVerificationStatus,
        activityType: "DOCUMENT_UNDER_REVIEW",
        title: "Document under review",
        body: "Document submission was marked as under review.",
      };

    case "VERIFY":
      return {
        requestStatus: "VERIFIED" as DocumentRequestStatus,
        submissionStatus: "VERIFIED" as DocumentSubmissionStatus,
        verificationStatus: "VERIFIED" as DocumentVerificationStatus,
        activityType: "DOCUMENT_VERIFIED",
        title: "Document verified",
        body: "Document submission was verified.",
      };

    case "REJECT":
      return {
        requestStatus: "REJECTED" as DocumentRequestStatus,
        submissionStatus: "REJECTED" as DocumentSubmissionStatus,
        verificationStatus: "REJECTED" as DocumentVerificationStatus,
        activityType: "DOCUMENT_REJECTED",
        title: "Document rejected",
        body: "Document submission was rejected.",
      };

    case "WAIVE":
      return {
        requestStatus: "WAIVED" as DocumentRequestStatus,
        submissionStatus: null,
        verificationStatus: null,
        activityType: "DOCUMENT_WAIVED",
        title: "Document request waived",
        body: "Document request was waived.",
      };
  }
}

function isReasonRequired(action: "UNDER_REVIEW" | "VERIFY" | "REJECT" | "WAIVE") {
  return action === "REJECT" || action === "WAIVE";
}

export async function POST(request: NextRequest) {
  try {
    const authContext = await requireRole(
      ["ADMIN", "SUPER_ADMIN"],
      "/admin/documents",
    );

    const currentUser = authContext.user as { id?: unknown };
    const currentUserId = typeof currentUser.id === "string" ? currentUser.id : "";

    if (!currentUserId) {
      return errorJson("Current user not found.", 401);
    }

    const body = await request.json();
    const validated = documentVerificationActionSchema.parse(body);

    if (isReasonRequired(validated.action) && !validated.reasonNote) {
      return errorJson("Reason is required for rejected or waived documents.", 400);
    }

    const requestRows = await db
      .select({
        requestId: schema.documentRequests.id,
        requestStatus: schema.documentRequests.requestStatus,
        bookingId: schema.documentRequests.bookingId,
        documentTypeName: schema.documentTypes.name,

        bookingCode: schema.bookings.bookingCode,
        bookingStatus: schema.bookings.status,
        leadId: schema.bookings.leadId,
      })
      .from(schema.documentRequests)
      .innerJoin(
        schema.documentTypes,
        eq(schema.documentRequests.documentTypeId, schema.documentTypes.id),
      )
      .innerJoin(schema.bookings, eq(schema.documentRequests.bookingId, schema.bookings.id))
      .where(
        and(
          eq(schema.documentRequests.id, validated.requestId),
          isNull(schema.documentRequests.deletedAt),
          isNull(schema.bookings.deletedAt),
        ),
      )
      .limit(1);

    const documentRequest = requestRows[0];

    if (!documentRequest) {
      return errorJson("Document request not found.", 404);
    }

    if (["VERIFIED", "WAIVED"].includes(documentRequest.requestStatus)) {
      return errorJson("This document request is already closed.", 400);
    }

    if (
      ["REJECTED", "EXPIRED", "CANCELLED"].includes(documentRequest.bookingStatus)
    ) {
      return errorJson("Document cannot be updated for inactive booking.", 400);
    }

    const config = getActionConfig(validated.action);
    const now = new Date();

    const submissionId = validated.submissionId || null;

    if (validated.action !== "WAIVE" && !submissionId) {
      return errorJson("Submission is required for this action.", 400);
    }

    if (submissionId) {
      const submission = await db.query.documentSubmissions.findFirst({
        where: (table, { and, eq, isNull }) =>
          and(
            eq(table.id, submissionId),
            eq(table.requestId, documentRequest.requestId),
            isNull(table.deletedAt),
          ),
        columns: {
          id: true,
          submissionStatus: true,
        },
      });

      if (!submission) {
        return errorJson("Document submission not found.", 404);
      }
    }

    await db.transaction(async (tx) => {
      await tx
        .update(schema.documentRequests)
        .set({
          requestStatus: config.requestStatus,
          updatedAt: now,
        })
        .where(eq(schema.documentRequests.id, documentRequest.requestId));

      if (submissionId && config.submissionStatus) {
        await tx
          .update(schema.documentSubmissions)
          .set({
            submissionStatus: config.submissionStatus,
            updatedAt: now,
          })
          .where(eq(schema.documentSubmissions.id, submissionId));

        if (config.verificationStatus) {
          await tx.insert(schema.documentVerificationLogs).values({
            bookingId: documentRequest.bookingId,
            submissionId,
            verificationStatus: config.verificationStatus,
            verifiedByUserId: currentUserId,
            verifiedAt: now,
            reasonCode: `DOCUMENT_${config.verificationStatus}`,
            reasonNote: validated.reasonNote || null,
          });
        }
      }

      await tx.insert(schema.bookingActivities).values({
        bookingId: documentRequest.bookingId,
        actorUserId: currentUserId,
        activityType: config.activityType,
        title: config.title,
        body: validated.reasonNote
          ? `${config.body} Reason: ${validated.reasonNote}`
          : config.body,
        visibilityScope: "INTERNAL",
        activityAt: now,
        metadata: {
          documentRequestId: documentRequest.requestId,
          submissionId,
          documentTypeName: documentRequest.documentTypeName,
          action: validated.action,
          reasonNote: validated.reasonNote || null,
        },
      });

      if (documentRequest.leadId) {
        await tx.insert(schema.leadActivities).values({
          leadId: documentRequest.leadId,
          actorUserId: currentUserId,
          activityType: config.activityType,
          title: config.title,
          body: `${documentRequest.documentTypeName}: ${config.body}`,
          visibilityScope: "INTERNAL",
          metadata: {
            bookingId: documentRequest.bookingId,
            bookingCode: documentRequest.bookingCode,
            documentRequestId: documentRequest.requestId,
            submissionId,
            action: validated.action,
            reasonNote: validated.reasonNote || null,
          },
        });
      }
    });

    return okJson({
      message: `${config.title} successfully.`,
      requestId: documentRequest.requestId,
      bookingId: documentRequest.bookingId,
      status: config.requestStatus,
    });
  } catch (error) {
    return errorJson(parseApiError(error));
  }
}
