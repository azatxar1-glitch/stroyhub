import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser, ApiError } from "@/lib/session";
import { handleApiError } from "@/lib/api-utils";
import { ROLES } from "@/lib/constants";
import { createNotification } from "@/lib/notifications";

const actionSchema = z.object({ action: z.enum(["accept", "reject"]) });

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await requireUser();
    const body = await req.json();
    const { action } = actionSchema.parse(body);

    const proposal = await prisma.proposal.findUnique({
      where: { id },
      include: { job: true, executor: true },
    });
    if (!proposal) return NextResponse.json({ error: "Отклик не найден" }, { status: 404 });

    if (proposal.job.customerId !== user.id && user.role !== ROLES.ADMIN) {
      throw new ApiError(403, "Нельзя управлять чужими откликами");
    }
    if (proposal.status !== "PENDING") {
      throw new ApiError(400, "Отклик уже обработан");
    }
    if (proposal.job.status !== "OPEN") {
      throw new ApiError(400, "Заявка уже не открыта");
    }

    if (action === "reject") {
      const updated = await prisma.proposal.update({ where: { id }, data: { status: "REJECTED" } });
      await createNotification({
        userId: proposal.executorId,
        type: "PROPOSAL_REJECTED",
        title: "Отклик отклонён",
        message: `Ваш отклик на заявку «${proposal.job.title}» отклонён`,
        link: `/jobs/${proposal.jobId}`,
      });
      return NextResponse.json(updated);
    }

    const [, , order] = await prisma.$transaction([
      prisma.proposal.update({ where: { id }, data: { status: "ACCEPTED" } }),
      prisma.proposal.updateMany({
        where: { jobId: proposal.jobId, id: { not: id }, status: "PENDING" },
        data: { status: "REJECTED" },
      }),
      prisma.order.create({
        data: {
          jobId: proposal.jobId,
          proposalId: proposal.id,
          customerId: proposal.job.customerId,
          executorId: proposal.executorId,
          price: proposal.price,
          deadline: proposal.durationDays ? `${proposal.durationDays} дн.` : proposal.job.deadline,
        },
      }),
      prisma.job.update({ where: { id: proposal.jobId }, data: { status: "IN_PROGRESS" } }),
      prisma.conversation.upsert({
        where: {
          jobId_customerId_executorId: {
            jobId: proposal.jobId,
            customerId: proposal.job.customerId,
            executorId: proposal.executorId,
          },
        },
        create: {
          jobId: proposal.jobId,
          customerId: proposal.job.customerId,
          executorId: proposal.executorId,
        },
        update: {},
      }),
    ]);

    const rejectedProposals = await prisma.proposal.findMany({
      where: { jobId: proposal.jobId, status: "REJECTED", id: { not: id } },
      select: { executorId: true },
    });
    await Promise.all(
      rejectedProposals.map((p) =>
        createNotification({
          userId: p.executorId,
          type: "PROPOSAL_REJECTED",
          title: "Отклик отклонён",
          message: `Заказчик выбрал другого исполнителя для заявки «${proposal.job.title}»`,
          link: `/jobs/${proposal.jobId}`,
        })
      )
    );

    await createNotification({
      userId: proposal.executorId,
      type: "PROPOSAL_ACCEPTED",
      title: "Ваш отклик принят!",
      message: `Заказчик выбрал вас для заявки «${proposal.job.title}». Заказ создан.`,
      link: `/dashboard/orders`,
    });

    return NextResponse.json(order);
  } catch (error) {
    return handleApiError(error);
  }
}
