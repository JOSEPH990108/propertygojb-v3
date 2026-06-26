import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { and, desc, eq, isNull } from "drizzle-orm";
import { NextRequest } from "next/server";

import { db, schema } from "@/db";
import { errorJson, okJson, parseApiError } from "@/lib/api/json";
import { requireRole } from "@/lib/auth/guards";

export const runtime = "nodejs";

type BookingStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "PAYMENT_PENDING"
  | "PAYMENT_VERIFIED"
  | "DOCS_PENDING"
  | "DOCS_VERIFIED"
  | "APPROVED"
  | "REJECTED"
  | "EXPIRED"
  | "CANCELLED";

function sanitizeFileName(fileName: string) {
  return fileName
    .trim()
    .replace(/[^\w.\-() ]+/g, "_")
    .replace(/\s+/g, "-")
    .slice(0, 160);
}

function getNextBookingStatus(currentStatus: string): BookingStatus {
  if (
    currentStatus === "APPROVED" ||
    currentStatus === "REJECTED" ||
    currentStatus === "EXPIRED" ||
    currentStatus === "CANCELLED"
  ) {
    return currentStatus;
  }

  return "DOCS_PENDING";
}

function isValidFile(value: FormDataEntryValue | null): value is File {
  return value instanceof File && value.size > 0;
}

export async function POST(request: NextRequest) {
  try {
    const authContext = await requireRole(
      ["ADMIN", "SUPER_ADMIN", "AGENT"],
      "/admin/documents",
    );

    const currentUser = authContext.user as { id?: unknown };
    const currentUserId = typeof currentUser.id === "string" ? currentUser.id : "";

    if (!currentUserId) {
      return errorJson("Current user not found.", 401);
    }

    const formData = await request.formData();
    const requestId = String(formData.get("requestId") ?? "").trim();
    const notes = String(formData.get("notes") ?? "").trim();
    const file = formData.get("file");

    if (!requestId) {
      return errorJson("Document request is required.", 400);
    }

    if (!isValidFile(file)) {
      return errorJson("Please upload a valid document file.", 400);
    }

    const requestRows = await db
      .select({
        requestId: schema.documentRequests.id,
        requestStatus: schema.documentRequests.requestStatus,
        bookingId: schema.documentRequests.bookingId,
        participantId: schema.documentRequests.participantId,
        documentTypeId: schema.documentRequests.documentTypeId,

        documentTypeName: schema.documentTypes.name,
        maxFileSizeBytes: schema.documentTypes.maxFileSizeBytes,

        bookingCode: schema.bookings.bookingCode,
        bookingStatus: schema.bookings.status,
        leadId: schema.bookings.leadId,
        assignedAgentUserId: schema.bookings.assignedAgentUserId,
      })
      .from(schema.documentRequests)
      .innerJoin(
        schema.documentTypes,
        eq(schema.documentRequests.documentTypeId, schema.documentTypes.id),
      )
      .innerJoin(schema.bookings, eq(schema.documentRequests.bookingId, schema.bookings.id))
      .where(
        and(
          eq(schema.documentRequests.id, requestId),
          isNull(schema.documentRequests.deletedAt),
          isNull(schema.bookings.deletedAt),
        ),
      )
      .limit(1);

    const documentRequest = requestRows[0];

    if (!documentRequest) {
      return errorJson("Document request not found.", 404);
    }

    const canManageAll =
      authContext.roleCode === "ADMIN" || authContext.roleCode === "SUPER_ADMIN";

    if (!canManageAll && documentRequest.assignedAgentUserId !== currentUserId) {
      return errorJson("You can only upload documents for assigned bookings.", 403);
    }

    if (documentRequest.requestStatus === "VERIFIED") {
      return errorJson("Verified document request cannot be replaced here.", 400);
    }

    if (documentRequest.requestStatus === "WAIVED") {
      return errorJson("Waived document request cannot be uploaded.", 400);
    }

    if (
      documentRequest.bookingStatus === "REJECTED" ||
      documentRequest.bookingStatus === "EXPIRED" ||
      documentRequest.bookingStatus === "CANCELLED"
    ) {
      return errorJson("Document cannot be uploaded for inactive booking.", 400);
    }

    if (
      documentRequest.maxFileSizeBytes &&
      file.size > documentRequest.maxFileSizeBytes
    ) {
      return errorJson("Uploaded file exceeds document type size limit.", 400);
    }

    const latestSubmissionRows = await db
      .select({
        id: schema.documentSubmissions.id,
        versionNo: schema.documentSubmissions.versionNo,
      })
      .from(schema.documentSubmissions)
      .where(
        and(
          eq(schema.documentSubmissions.requestId, documentRequest.requestId),
          isNull(schema.documentSubmissions.deletedAt),
        ),
      )
      .orderBy(desc(schema.documentSubmissions.versionNo))
      .limit(1);

    const latestSubmission = latestSubmissionRows[0];
    const nextVersionNo = (latestSubmission?.versionNo ?? 0) + 1;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const checksum = createHash("sha256").update(buffer).digest("hex");

    const safeFileName = sanitizeFileName(file.name || "document-upload");
    const storageKey = path.posix.join(
      "document-uploads",
      documentRequest.requestId,
      `${Date.now()}-v${nextVersionNo}-${safeFileName}`,
    );

    const uploadRoot = path.join(process.cwd(), ".local-uploads");
    const absoluteFilePath = path.join(uploadRoot, storageKey);

    await mkdir(path.dirname(absoluteFilePath), { recursive: true });
    await writeFile(absoluteFilePath, buffer);

    const now = new Date();
    const nextBookingStatus = getNextBookingStatus(documentRequest.bookingStatus);

    const created = await db.transaction(async (tx) => {
      const insertedFiles = await tx
        .insert(schema.files)
        .values({
          provider: "LOCAL",
          bucket: "document-uploads",
          key: storageKey,
          url: null,
          mimeType: file.type || "application/octet-stream",
          size: file.size,
          checksum,
          scanStatus: "PENDING",
          visibilityScope: "RESTRICTED",
          uploadedByUserId: currentUserId,
        })
        .returning({
          id: schema.files.id,
        });

      const fileRecord = insertedFiles[0];

      if (!fileRecord) {
        throw new Error("Failed to create file record.");
      }

      await tx
        .update(schema.files)
        .set({
          url: `/api/internal/files/${fileRecord.id}/download`,
          updatedAt: now,
        })
        .where(eq(schema.files.id, fileRecord.id));

      const insertedSubmissions = await tx
        .insert(schema.documentSubmissions)
        .values({
          bookingId: documentRequest.bookingId,
          requestId: documentRequest.requestId,
          participantId: documentRequest.participantId,
          documentTypeId: documentRequest.documentTypeId,
          fileId: fileRecord.id,
          submissionStatus: "SUBMITTED",
          uploadedByUserId: currentUserId,
          uploadedAt: now,
          versionNo: nextVersionNo,
          notes: notes || null,
        })
        .returning({
          id: schema.documentSubmissions.id,
        });

      const submission = insertedSubmissions[0];

      if (!submission) {
        throw new Error("Failed to create document submission.");
      }

      if (latestSubmission) {
        await tx
          .update(schema.documentSubmissions)
          .set({
            submissionStatus: "REPLACED",
            replacedBySubmissionId: submission.id,
            updatedAt: now,
          })
          .where(eq(schema.documentSubmissions.id, latestSubmission.id));
      }

      await tx
        .update(schema.documentRequests)
        .set({
          requestStatus: "SUBMITTED",
          updatedAt: now,
        })
        .where(eq(schema.documentRequests.id, documentRequest.requestId));

      if (documentRequest.bookingStatus !== nextBookingStatus) {
        await tx
          .update(schema.bookings)
          .set({
            status: nextBookingStatus,
            updatedAt: now,
          })
          .where(eq(schema.bookings.id, documentRequest.bookingId));

        await tx.insert(schema.bookingStatusHistory).values({
          bookingId: documentRequest.bookingId,
          fromStatus: documentRequest.bookingStatus,
          toStatus: nextBookingStatus,
          changedByUserId: currentUserId,
          changedAt: now,
          reasonCode: "DOCUMENT_UPLOADED",
          reasonNote: notes || null,
          sourceEventType: "DOCUMENT_SUBMISSION",
        });
      }

      await tx.insert(schema.bookingActivities).values({
        bookingId: documentRequest.bookingId,
        actorUserId: currentUserId,
        activityType: "DOCUMENT_UPLOADED",
        title: "Document uploaded",
        body: `${documentRequest.documentTypeName} uploaded as version ${nextVersionNo}.`,
        visibilityScope: "INTERNAL",
        activityAt: now,
        metadata: {
          documentRequestId: documentRequest.requestId,
          submissionId: submission.id,
          fileId: fileRecord.id,
          fileName: safeFileName,
          versionNo: nextVersionNo,
          notes: notes || null,
        },
      });

      if (documentRequest.leadId) {
        await tx.insert(schema.leadActivities).values({
          leadId: documentRequest.leadId,
          actorUserId: currentUserId,
          activityType: "DOCUMENT_UPLOADED",
          title: "Document uploaded",
          body: `${documentRequest.documentTypeName} uploaded for booking ${documentRequest.bookingCode}.`,
          visibilityScope: "INTERNAL",
          metadata: {
            bookingId: documentRequest.bookingId,
            bookingCode: documentRequest.bookingCode,
            documentRequestId: documentRequest.requestId,
            submissionId: submission.id,
            fileId: fileRecord.id,
            versionNo: nextVersionNo,
          },
        });
      }

      return {
        fileId: fileRecord.id,
        submissionId: submission.id,
      };
    });

    return okJson({
      message: "Document uploaded successfully.",
      requestId: documentRequest.requestId,
      bookingId: documentRequest.bookingId,
      fileId: created.fileId,
      submissionId: created.submissionId,
      versionNo: nextVersionNo,
    });
  } catch (error) {
    return errorJson(parseApiError(error));
  }
}
