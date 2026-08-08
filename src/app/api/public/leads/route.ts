import { and, eq, isNull } from "drizzle-orm";
import { NextRequest } from "next/server";
import { z } from "zod";

import { db, schema } from "@/db";
import { errorJson, okJson, parseApiError } from "@/lib/api/json";
import { writeAuditLog } from "@/lib/audit/log";
import { getCurrentAuthContext } from "@/lib/auth/guards";
import { parseMalaysiaViewingDateTime, VIEWING_TIME_ZONE } from "@/lib/public/viewing";

function normalizePhone(value: string) {
  const digits = value.replace(/\D/g, "");

  if (!digits) {
    return "";
  }

  if (digits.startsWith("60")) {
    return digits;
  }

  if (digits.startsWith("0")) {
    return `60${digits.slice(1)}`;
  }

  return digits;
}

function toE164(value: string) {
  const normalized = normalizePhone(value);
  return normalized ? `+${normalized}` : "";
}

const publicLeadSchema = z.object({
  projectId: z.string().min(1, "Project is required."),
  projectName: z.string().trim().min(1).max(200),
  fullName: z.string().trim().min(1, "Name is required.").max(150),
  phoneNumber: z.string().trim().min(7, "Mobile number is required.").max(30),
  email: z
    .string()
    .trim()
    .email("Email must be valid.")
    .optional()
    .or(z.literal(""))
    .transform((value) => value || null),
  preferredContactMethod: z.enum(["WHATSAPP", "CALL", "EMAIL"]).optional().nullable(),
  message: z.string().trim().max(1000).optional().default(""),
  sourcePage: z.string().trim().max(300).optional().nullable(),
  attribution: z
    .object({
      source: z.string().max(200).nullable(),
      medium: z.string().max(200).nullable(),
      campaign: z.string().max(300).nullable(),
      content: z.string().max(300).nullable(),
      term: z.string().max(300).nullable(),
      clickId: z.string().max(500).nullable(),
      referrer: z.string().max(2000).nullable(),
      landingPath: z.string().max(2000),
    })
    .optional(),
  viewingPreference: z
    .object({
      date: z.string().trim().min(1),
      time: z.string().trim().min(1),
      durationMinutes: z.coerce.number().int().min(30).max(180).default(60),
    })
    .optional()
    .nullable(),
});

async function getOrCreateWebsiteLeadSource() {
  const existing = await db.query.leadSources.findFirst({
    where: (table, { eq }) => eq(table.code, "WEBSITE_PROJECT"),
    columns: {
      id: true,
    },
  });

  if (existing) {
    return existing.id;
  }

  const inserted = await db
    .insert(schema.leadSources)
    .values({
      code: "WEBSITE_PROJECT",
      name: "Website Project Enquiry",
      description: "Lead submitted from public project pages.",
      channel: "WEBSITE",
      isActive: true,
      priority: 10,
    })
    .returning({
      id: schema.leadSources.id,
    });

  const source = inserted[0];

  if (!source) {
    throw new Error("Failed to create lead source.");
  }

  return source.id;
}

export async function POST(request: NextRequest) {
  try {
    const [body, authContext] = await Promise.all([
      request.json(),
      getCurrentAuthContext(),
    ]);
    const validated = publicLeadSchema.parse(body);

    const phoneNormalized = normalizePhone(validated.phoneNumber);
    const phoneE164 = toE164(validated.phoneNumber);

    if (!phoneNormalized || !phoneE164) {
      return errorJson("Mobile number is invalid.", 400);
    }

    const project = await db.query.projects.findFirst({
      where: (table, { eq }) => eq(table.id, validated.projectId),
      columns: {
        id: true,
        propertyCategoryId: true,
        propertyTypeId: true,
        regionId: true,
        areaId: true,
      },
    });

    if (!project) {
      return errorJson("Project not found.", 404);
    }

    const viewingDateTime = validated.viewingPreference
      ? parseMalaysiaViewingDateTime(
          validated.viewingPreference.date,
          validated.viewingPreference.time,
        )
      : null;

    if (viewingDateTime && !viewingDateTime.ok) {
      return errorJson(viewingDateTime.message, 400);
    }

    const sourceId = await getOrCreateWebsiteLeadSource();
    const now = new Date();
    const sessionUser = authContext.user as
      | { id?: string; email?: string; phoneNumber?: string | null }
      | null;
    const sessionPhone = sessionUser?.phoneNumber
      ? normalizePhone(sessionUser.phoneNumber)
      : "";
    const identityMatches = Boolean(
      sessionUser?.id &&
        ((sessionPhone && sessionPhone === phoneNormalized) ||
          (validated.email &&
            sessionUser.email?.toLowerCase() === validated.email.toLowerCase())),
    );
    const customerUserId = identityMatches ? sessionUser?.id : null;

    const result = await db.transaction(async (tx) => {
      const existingLead = await tx.query.leads.findFirst({
        where: (table, { eq }) =>
          eq(table.primaryPhoneNormalized, phoneNormalized),
        columns: {
          id: true,
        },
      });
      let leadId = existingLead?.id;
      let isNewLead = false;

      if (leadId) {
        await tx
        .update(schema.leads)
        .set({
          ...(customerUserId ? { customerUserId } : {}),
          fullName: validated.fullName,
          email: validated.email,
          desiredPropertyCategoryId: project.propertyCategoryId,
          desiredPropertyTypeId: project.propertyTypeId,
          preferredRegionId: project.regionId,
          preferredAreaId: project.areaId,
          lastActivityAt: now,
          updatedAt: now,
          metadata: {
            lastSourcePage: validated.sourcePage,
            lastProjectName: validated.projectName,
            preferredContactMethod: validated.preferredContactMethod,
            attribution: validated.attribution,
          },
        })
        .where(eq(schema.leads.id, leadId));
      } else {
        const insertedLead = await tx
        .insert(schema.leads)
        .values({
          sourceId,
          customerUserId,
          fullName: validated.fullName,
          primaryPhoneE164: phoneE164,
          primaryPhoneNormalized: phoneNormalized,
          email: validated.email,
          desiredPropertyCategoryId: project.propertyCategoryId,
          desiredPropertyTypeId: project.propertyTypeId,
          preferredRegionId: project.regionId,
          preferredAreaId: project.areaId,
          currentStatus: "NEW",
          firstInquiryAt: now,
          lastActivityAt: now,
          metadata: {
            sourcePage: validated.sourcePage,
            projectName: validated.projectName,
            preferredContactMethod: validated.preferredContactMethod,
            attribution: validated.attribution,
          },
        })
        .returning({
          id: schema.leads.id,
        });

        const lead = insertedLead[0];

        if (!lead) {
          throw new Error("Failed to create lead.");
        }

        leadId = lead.id;
        isNewLead = true;
      }

      const insertedInquiry = await tx
      .insert(schema.inquiries)
      .values({
        leadId,
        sourceId,
        channel: "WEBSITE",
        requesterName: validated.fullName,
        requesterPhoneE164: phoneE164,
        requesterPhoneNormalized: phoneNormalized,
        requesterEmail: validated.email,
        projectId: project.id,
        messageText:
          validated.message ||
          `I am interested in ${validated.projectName}. Please send me more details.`,
        payload: {
          sourcePage: validated.sourcePage,
          projectName: validated.projectName,
          preferredContactMethod: validated.preferredContactMethod,
          attribution: validated.attribution,
          viewingPreference: validated.viewingPreference,
        },
        receivedAt: now,
      })
      .returning({
        id: schema.inquiries.id,
      });

      await tx.insert(schema.leadActivities).values({
      leadId,
      activityType: "INQUIRY_CREATED",
      title: "Website project enquiry",
      body:
        validated.message ||
        `Interested in ${validated.projectName}. Please follow up.`,
      visibilityScope: "INTERNAL",
      metadata: {
        inquiryId: insertedInquiry[0]?.id,
        projectId: project.id,
        projectName: validated.projectName,
        preferredContactMethod: validated.preferredContactMethod,
        attribution: validated.attribution,
      },
    });

      if (isNewLead) {
        await tx.insert(schema.leadStatusHistory).values({
        leadId,
        fromStatus: null,
        toStatus: "NEW",
        changedAt: now,
        sourceEventType: "WEBSITE_INQUIRY",
      });
      }

      let viewingActivityId: string | null = null;
      let isDuplicateViewingRequest = false;

      if (viewingDateTime?.ok && validated.viewingPreference) {
        const matchingAppointments = await tx
          .select({
            id: schema.leadActivities.id,
            metadata: schema.leadActivities.metadata,
          })
          .from(schema.leadActivities)
          .where(
            and(
              eq(schema.leadActivities.leadId, leadId),
              eq(schema.leadActivities.activityType, "VIEWING_APPOINTMENT"),
              eq(schema.leadActivities.dueAt, viewingDateTime.scheduledAt),
              isNull(schema.leadActivities.deletedAt),
            ),
          )
          .limit(5);
        const duplicate = matchingAppointments.find((appointment) => {
          const metadata = appointment.metadata;
          return Boolean(
            metadata &&
              typeof metadata === "object" &&
              !Array.isArray(metadata) &&
              "projectId" in metadata &&
              metadata.projectId === project.id &&
              "appointmentStatus" in metadata &&
              ["REQUESTED", "SCHEDULED"].includes(String(metadata.appointmentStatus)),
          );
        });

        if (duplicate) {
          viewingActivityId = duplicate.id;
          isDuplicateViewingRequest = true;
        } else {
          const insertedViewing = await tx
            .insert(schema.leadActivities)
            .values({
              leadId,
              actorUserId: customerUserId,
              activityType: "VIEWING_APPOINTMENT",
              title: "Viewing request submitted",
              body: `Preferred viewing for ${validated.projectName}. Staff confirmation required.`,
              dueAt: viewingDateTime.scheduledAt,
              visibilityScope: "CUSTOMER",
              metadata: {
                appointmentStatus: "REQUESTED",
                projectId: project.id,
                projectName: validated.projectName,
                locationText: null,
                durationMinutes: validated.viewingPreference.durationMinutes,
                note: validated.message || null,
                source: "PUBLIC_WEBSITE",
                timeZone: VIEWING_TIME_ZONE,
                requestedAt: now.toISOString(),
                inquiryId: insertedInquiry[0]?.id,
              },
            })
            .returning({ id: schema.leadActivities.id });

          viewingActivityId = insertedViewing[0]?.id ?? null;
        }
      }

      return {
        leadId,
        inquiryId: insertedInquiry[0]?.id ?? null,
        viewingActivityId,
        isNewLead,
        isDuplicateViewingRequest,
      };
    });

    await writeAuditLog({
      actionType: "CREATE_INQUIRY",
      entityType: "INQUIRY",
      entityId: result.inquiryId,
      actorUserId: customerUserId,
      sourceApp: "PUBLIC_WEBSITE",
      changeSummary: `Public enquiry submitted for ${validated.projectName}.`,
      afterJson: {
        leadId: result.leadId,
        projectId: project.id,
        preferredContactMethod: validated.preferredContactMethod,
      },
      metadata: {
        sourcePage: validated.sourcePage,
        linkedToCustomerAccount: Boolean(customerUserId),
        isNewLead: result.isNewLead,
        attribution: validated.attribution,
      },
      request,
    });

    if (result.viewingActivityId && viewingDateTime?.ok) {
      await writeAuditLog({
        actionType: result.isDuplicateViewingRequest
          ? "REUSE_VIEWING_REQUEST"
          : "CREATE_VIEWING_REQUEST",
        entityType: "VIEWING_APPOINTMENT",
        entityId: result.viewingActivityId,
        actorUserId: customerUserId,
        sourceApp: "PUBLIC_WEBSITE",
        changeSummary: result.isDuplicateViewingRequest
          ? `Duplicate viewing request reused for ${validated.projectName}.`
          : `Public viewing requested for ${validated.projectName}.`,
        afterJson: {
          leadId: result.leadId,
          projectId: project.id,
          appointmentStatus: "REQUESTED",
          preferredAt: viewingDateTime.scheduledAt.toISOString(),
          durationMinutes: validated.viewingPreference?.durationMinutes,
        },
        metadata: {
          sourcePage: validated.sourcePage,
          linkedToCustomerAccount: Boolean(customerUserId),
          timeZone: VIEWING_TIME_ZONE,
        },
        request,
      });
    }

    return okJson({
      message: result.viewingActivityId
        ? "Your preferred viewing time was received. Our team will confirm the appointment."
        : "Thank you. Our team will contact you soon.",
      leadId: result.leadId,
      inquiryId: result.inquiryId,
      viewingActivityId: result.viewingActivityId,
    });
  } catch (error) {
    return errorJson(parseApiError(error));
  }
}
