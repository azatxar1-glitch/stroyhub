import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { handleApiError } from "@/lib/api-utils";
import { ROLES } from "@/lib/constants";

const patchSchema = z.object({ status: z.enum(["OPEN", "RESOLVED", "DISMISSED"]) });

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole(ROLES.ADMIN);
    const { id } = await params;
    const body = await req.json();
    const { status } = patchSchema.parse(body);

    const complaint = await prisma.complaint.update({ where: { id }, data: { status } });
    return NextResponse.json(complaint);
  } catch (error) {
    return handleApiError(error);
  }
}
