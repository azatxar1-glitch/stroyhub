import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { handleApiError } from "@/lib/api-utils";
import { ROLES } from "@/lib/constants";

export async function GET() {
  try {
    await requireRole(ROLES.ADMIN);
    const jobs = await prisma.job.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        category: { select: { name: true } },
        customer: { select: { id: true, name: true, email: true } },
        _count: { select: { proposals: true } },
      },
    });
    return NextResponse.json(jobs);
  } catch (error) {
    return handleApiError(error);
  }
}
