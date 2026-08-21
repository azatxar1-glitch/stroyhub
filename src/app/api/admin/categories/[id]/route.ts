import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole, ApiError } from "@/lib/session";
import { handleApiError } from "@/lib/api-utils";
import { ROLES } from "@/lib/constants";

const updateSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  icon: z.string().max(60).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole(ROLES.ADMIN);
    const { id } = await params;
    const body = await req.json();
    const data = updateSchema.parse(body);

    const category = await prisma.category.update({ where: { id }, data });
    return NextResponse.json(category);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole(ROLES.ADMIN);
    const { id } = await params;

    const [jobCount, execCount] = await Promise.all([
      prisma.job.count({ where: { categoryId: id } }),
      prisma.executorProfile.count({ where: { categoryId: id } }),
    ]);
    if (jobCount > 0 || execCount > 0) {
      throw new ApiError(400, "Нельзя удалить категорию, которая уже используется");
    }

    await prisma.category.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
