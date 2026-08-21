import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { proposalCreateSchema } from "@/lib/validations";
import { requireRole, requireUser, ApiError } from "@/lib/session";
import { handleApiError } from "@/lib/api-utils";
import { ROLES } from "@/lib/constants";
import { createNotification } from "@/lib/notifications";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await requireUser();
    const job = await prisma.job.findUnique({ where: { id } });
    if (!job) return NextResponse.json({ error: "Заявка не найдена" }, { status: 404 });

    if (job.customerId !== user.id && user.role !== ROLES.ADMIN) {
      throw new ApiError(403, "Нет доступа к откликам этой заявки");
    }

    const proposals = await prisma.proposal.findMany({
      where: { jobId: id },
      include: {
        executor: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            city: true,
            executorProfile: { select: { ratingAvg: true, ratingCount: true, completedOrders: true, headline: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(proposals);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await requireRole(ROLES.EXECUTOR);
    const job = await prisma.job.findUnique({ where: { id } });
    if (!job) return NextResponse.json({ error: "Заявка не найдена" }, { status: 404 });
    if (job.status !== "OPEN") {
      throw new ApiError(400, "Заявка больше не принимает отклики");
    }

    const body = await req.json();
    const data = proposalCreateSchema.parse(body);

    const existing = await prisma.proposal.findUnique({
      where: { jobId_executorId: { jobId: id, executorId: user.id } },
    });
    if (existing) {
      throw new ApiError(409, "Вы уже откликнулись на эту заявку");
    }

    const proposal = await prisma.proposal.create({
      data: {
        jobId: id,
        executorId: user.id,
        price: data.price,
        durationDays: data.durationDays ?? null,
        comment: data.comment,
      },
    });

    await createNotification({
      userId: job.customerId,
      type: "PROPOSAL_RECEIVED",
      title: "Новый отклик на заявку",
      message: `${user.name} откликнулся на заявку «${job.title}»`,
      link: `/jobs/${job.id}`,
    });

    return NextResponse.json(proposal, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
