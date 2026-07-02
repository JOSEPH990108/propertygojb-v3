import { readFile } from "node:fs/promises";
import path from "node:path";

import { and, eq, isNull } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { db, schema } from "@/db";
import { requireRole } from "@/lib/auth/guards";

export const runtime = "nodejs";

type FileDownloadRouteContext = {
  params: Promise<{
    fileId: string;
  }>;
};

function getSafeDownloadName(key: string) {
  return key.split("/").pop() || "document";
}

export async function GET(
  _request: NextRequest,
  { params }: FileDownloadRouteContext,
) {
  const authContext = await requireRole(
    ["ADMIN", "SUPER_ADMIN", "AGENT"],
    "/admin/documents",
  );

  const currentUser = authContext.user as { id?: unknown };
  const currentUserId = typeof currentUser.id === "string" ? currentUser.id : "";
  const canManageAll =
    authContext.roleCode === "ADMIN" || authContext.roleCode === "SUPER_ADMIN";

  const { fileId } = await params;

  const rows = await db
    .select({
      fileId: schema.files.id,
      provider: schema.files.provider,
      key: schema.files.key,
      url: schema.files.url,
      mimeType: schema.files.mimeType,
      assignedAgentUserId: schema.bookings.assignedAgentUserId,
    })
    .from(schema.files)
    .innerJoin(schema.documentSubmissions, eq(schema.files.id, schema.documentSubmissions.fileId))
    .innerJoin(schema.bookings, eq(schema.documentSubmissions.bookingId, schema.bookings.id))
    .where(
      and(
        eq(schema.files.id, fileId),
        isNull(schema.files.deletedAt),
        isNull(schema.documentSubmissions.deletedAt),
        isNull(schema.bookings.deletedAt),
      ),
    )
    .limit(1);

  const file = rows[0];

  if (!file) {
    return NextResponse.json({ message: "File not found." }, { status: 404 });
  }

  if (!canManageAll && file.assignedAgentUserId !== currentUserId) {
    return NextResponse.json({ message: "Forbidden." }, { status: 403 });
  }

  if (file.provider !== "LOCAL") {
    if (file.url && !file.url.includes(`/api/internal/files/${fileId}/download`)) {
      return NextResponse.redirect(file.url);
    }

    return NextResponse.json(
      { message: "File provider is not available for download." },
      { status: 400 },
    );
  }

  const normalizedKey = path.normalize(file.key);

  if (normalizedKey.startsWith("..") || path.isAbsolute(normalizedKey)) {
    return NextResponse.json({ message: "Invalid file key." }, { status: 400 });
  }

  const absoluteFilePath = path.join(process.cwd(), ".local-uploads", normalizedKey);
  const fileBuffer = await readFile(absoluteFilePath);
  const fileName = getSafeDownloadName(file.key);

  return new NextResponse(new Uint8Array(fileBuffer), {
    headers: {
      "Content-Type": file.mimeType || "application/octet-stream",
      "Content-Disposition": `attachment; filename="${encodeURIComponent(fileName)}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
