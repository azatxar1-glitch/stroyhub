import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jobUpdateSchema } from "@/lib/validations";
import { requireUser, ApiError } from "@/lib/session";
import { handleApiError } from "@/lib/api-utils";
import { ROLES } from "@/lib/constants";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const job = await prisma.job.findUnique({
      where: { id },
      include: {
        category: true,
        customer: { select: { id: true, name: true, avatarUrl: true, city: true, createdAt: true } },
        attachments: true,
        _count: { select: { proposals: true } },
      },
    });
    if (!job) return NextResponse.json({ error: "Заявка не найдена" }, { status: 404 });
    return NextResponse.json(job);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await requireUser();
    const job = await prisma.job.findUnique({ where: { id } });
    if (!job) return NextResponse.json({ error: "Заявка не найдена" }, { status: 404 });

    if (job.customerId !== user.id && user.role !== ROLES.ADMIN) {
      throw new ApiError(403, "Нельзя редактировать чужую заявку");
    }

    const body = await req.json();
    const data = jobUpdateSchema.parse(body);

    const updated = await prisma.job.update({
      where: { id },
      data: {
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.categoryId !== undefined ? { categoryId: data.categoryId } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.city !== undefined ? { city: data.city } : {}),
        ...(data.address !== undefined ? { address: data.address || null } : {}),
        ...(data.locationType !== undefined ? { locationType: data.locationType } : {}),
        ...(data.budget !== undefined ? { budget: data.budget } : {}),
        ...(data.deadline !== undefined ? { deadline: data.deadline || null } : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
      },
      include: { category: true, attachments: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await requireUser();
    const job = await prisma.job.findUnique({ where: { id } });
    if (!job) return NextResponse.json({ error: "Заявка не найдена" }, { status: 404 });

    if (job.customerId !== user.id && user.role !== ROLES.ADMIN) {
      throw new ApiError(403, "Нельзя удалить чужую заявку");
    }

    await prisma.job.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
