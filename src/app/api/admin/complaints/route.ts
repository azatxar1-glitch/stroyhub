import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { handleApiError } from "@/lib/api-utils";
import { ROLES } from "@/lib/constants";

export async function GET() {
  try {
    await requireRole(ROLES.ADMIN);
    const complaints = await prisma.complaint.findMany({
      orderBy: { createdAt: "desc" },
      include: { reporter: { select: { id: true, name: true, email: true } } },
    });
    return NextResponse.json(complaints);
  } catch (error) {
    return handleApiError(error);
  }
}
