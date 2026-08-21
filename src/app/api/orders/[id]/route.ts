import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { orderStatusSchema } from "@/lib/validations";
import { requireUser, ApiError } from "@/lib/session";
import { handleApiError } from "@/lib/api-utils";
import { ORDER_STATUS_FLOW, ROLES } from "@/lib/constants";
import { createNotification } from "@/lib/notifications";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await requireUser();
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        job: true,
        customer: { select: { id: true, name: true, avatarUrl: true } },
        executor: { select: { id: true, name: true, avatarUrl: true } },
        reviews: true,
      },
    });
    if (!order) return NextResponse.json({ error: "Заказ не найден" }, { status: 404 });
    if (order.customerId !== user.id && order.executorId !== user.id && user.role !== ROLES.ADMIN) {
      throw new ApiError(403, "Нет доступа к этому заказу");
    }
    return NextResponse.json(order);
  } catch (error) {
    return handleApiError(error);
  }
}

const TRANSITION_ACTORS: Record<string, "customer" | "executor" | "either"> = {
  "NEW->IN_PROGRESS": "executor",
  "NEW->CANCELLED": "either",
  "IN_PROGRESS->REVIEW": "executor",
  "IN_PROGRESS->CANCELLED": "either",
  "REVIEW->COMPLETED": "customer",
  "REVIEW->IN_PROGRESS": "customer",
};

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await requireUser();
    const body = await req.json();
    const { status: nextStatus } = orderStatusSchema.parse(body);

    const order = await prisma.order.findUnique({ where: { id }, include: { job: true } });
    if (!order) return NextResponse.json({ error: "Заказ не найден" }, { status: 404 });

    const isCustomer = order.customerId === user.id;
    const isExecutor = order.executorId === user.id;
    if (!isCustomer && !isExecutor && user.role !== ROLES.ADMIN) {
      throw new ApiError(403, "Нет доступа к этому заказу");
    }

    const allowed = ORDER_STATUS_FLOW[order.status as keyof typeof ORDER_STATUS_FLOW] ?? [];
    if (!allowed.includes(nextStatus)) {
      throw new ApiError(400, `Нельзя перевести заказ из статуса ${order.status} в ${nextStatus}`);
    }

    const actor = TRANSITION_ACTORS[`${order.status}->${nextStatus}`];
    if (user.role !== ROLES.ADMIN) {
      if (actor === "customer" && !isCustomer) throw new ApiError(403, "Это действие доступно только заказчику");
      if (actor === "executor" && !isExecutor) throw new ApiError(403, "Это действие доступно только исполнителю");
    }

    const updated = await prisma.order.update({
      where: { id },
      data: {
        status: nextStatus,
        completedAt: nextStatus === "COMPLETED" ? new Date() : order.completedAt,
      },
    });

    if (nextStatus === "COMPLETED") {
      await prisma.job.update({ where: { id: order.jobId }, data: { status: "COMPLETED" } });
      await prisma.executorProfile.updateMany({
        where: { userId: order.executorId },
        data: { completedOrders: { increment: 1 } },
      });
    }
    if (nextStatus === "CANCELLED") {
      await prisma.job.update({ where: { id: order.jobId }, data: { status: "CANCELLED" } });
    }

    const otherUserId = isCustomer ? order.executorId : order.customerId;
    await createNotification({
      userId: otherUserId,
      type: "ORDER_STATUS_CHANGED",
      title: "Статус заказа изменён",
      message: `Заказ «${order.job.title}» переведён в статус «${nextStatus}»`,
      link: `/dashboard/orders/${order.id}`,
    });

    return NextResponse.json(updated);
  } catch (error) {
    return handleApiError(error);
  }
}
