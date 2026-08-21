import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { portfolioItemSchema } from "@/lib/validations";
import { requireRole, ApiError } from "@/lib/session";
import { handleApiError } from "@/lib/api-utils";
import { ROLES } from "@/lib/constants";

export async function POST(req: NextRequest) {
  try {
    const user = await requireRole(ROLES.EXECUTOR);
    const profile = await prisma.executorProfile.findUnique({ where: { userId: user.id } });
    if (!profile) throw new ApiError(400, "Сначала заполните профиль исполнителя");

    const body = await req.json();
    const data = portfolioItemSchema.parse(body);

    const item = await prisma.portfolioItem.create({
      data: {
        executorProfileId: profile.id,
        title: data.title,
        description: data.description || null,
        imageUrl: data.imageUrl,
      },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
