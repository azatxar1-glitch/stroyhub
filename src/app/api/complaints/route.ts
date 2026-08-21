import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { complaintSchema } from "@/lib/validations";
import { requireUser } from "@/lib/session";
import { handleApiError } from "@/lib/api-utils";

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const data = complaintSchema.parse(body);

    const complaint = await prisma.complaint.create({
      data: {
        reporterId: user.id,
        targetType: data.targetType,
        targetId: data.targetId,
        reason: data.reason,
      },
    });

    return NextResponse.json(complaint, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
