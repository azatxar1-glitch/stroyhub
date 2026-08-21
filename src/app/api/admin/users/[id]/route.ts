import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole, ApiError } from "@/lib/session";
import { handleApiError } from "@/lib/api-utils";
import { ROLES } from "@/lib/constants";

const patchSchema = z.object({
  isBlocked: z.boolean().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const admin = await requireRole(ROLES.ADMIN);
    const body = await req.json();
    const data = patchSchema.parse(body);

    if (id === admin.id && data.isBlocked) {
      throw new ApiError(400, "Нельзя заблокировать собственный аккаунт");
    }

    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 });
    if (target.role === ROLES.ADMIN) throw new ApiError(400, "Нельзя заблокировать администратора");

    const updated = await prisma.user.update({ where: { id }, data });
    return NextResponse.json({ id: updated.id, isBlocked: updated.isBlocked });
  } catch (error) {
    return handleApiError(error);
  }
}
