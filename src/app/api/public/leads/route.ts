import { eq } from "drizzle-orm";
import { NextRequest } from "next/server";
import { z } from "zod";

import { db, schema } from "@/db";
import { errorJson, okJson, parseApiError } from "@/lib/api/json";

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
  message: z.string().trim().max(1000).optional().default(""),
  sourcePage: z.string().trim().max(300).optional().nullable(),
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
    const body = await request.json();
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

    const sourceId = await getOrCreateWebsiteLeadSource();
    const now = new Date();

    const existingLead = await db.query.leads.findFirst({
      where: (table, { eq }) =>
        eq(table.primaryPhoneNormalized, phoneNormalized),
      columns: {
        id: true,
      },
    });

    let leadId = existingLead?.id;
    let isNewLead = false;

    if (leadId) {
      await db
        .update(schema.leads)
        .set({
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
          },
        })
        .where(eq(schema.leads.id, leadId));
    } else {
      const insertedLead = await db
        .insert(schema.leads)
        .values({
          sourceId,
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

    const insertedInquiry = await db
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
        },
        receivedAt: now,
      })
      .returning({
        id: schema.inquiries.id,
      });

    await db.insert(schema.leadActivities).values({
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
      },
    });

    if (isNewLead) {
      await db.insert(schema.leadStatusHistory).values({
        leadId,
        fromStatus: null,
        toStatus: "NEW",
        changedAt: now,
        sourceEventType: "WEBSITE_INQUIRY",
      });
    }

    return okJson({
      message: "Thank you. Our team will contact you soon.",
      leadId,
      inquiryId: insertedInquiry[0]?.id,
    });
  } catch (error) {
    return errorJson(parseApiError(error));
  }
}
