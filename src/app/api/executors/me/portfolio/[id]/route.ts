import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, ApiError } from "@/lib/session";
import { handleApiError } from "@/lib/api-utils";
import { ROLES } from "@/lib/constants";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await requireRole(ROLES.EXECUTOR);
    const profile = await prisma.executorProfile.findUnique({ where: { userId: user.id } });
    if (!profile) throw new ApiError(404, "Профиль не найден");

    const item = await prisma.portfolioItem.findUnique({ where: { id } });
    if (!item || item.executorProfileId !== profile.id) {
      throw new ApiError(403, "Нельзя удалить чужой элемент портфолио");
    }

    await prisma.portfolioItem.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
