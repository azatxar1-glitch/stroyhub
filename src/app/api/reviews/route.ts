import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { reviewSchema } from "@/lib/validations";
import { requireUser, ApiError } from "@/lib/session";
import { handleApiError } from "@/lib/api-utils";
import { createNotification } from "@/lib/notifications";

const createSchema = reviewSchema.extend({ orderId: z.string().min(1) });

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const data = createSchema.parse(body);

    const order = await prisma.order.findUnique({ where: { id: data.orderId }, include: { job: true } });
    if (!order) return NextResponse.json({ error: "Заказ не найден" }, { status: 404 });

    const isCustomer = order.customerId === user.id;
    const isExecutor = order.executorId === user.id;
    if (!isCustomer && !isExecutor) throw new ApiError(403, "Нет доступа к этому заказу");
    if (order.status !== "COMPLETED") throw new ApiError(400, "Оставить отзыв можно только после завершения заказа");

    const targetId = isCustomer ? order.executorId : order.customerId;

    const existing = await prisma.review.findUnique({
      where: { orderId_authorId: { orderId: order.id, authorId: user.id } },
    });
    if (existing) throw new ApiError(409, "Вы уже оставили отзыв по этому заказу");

    const review = await prisma.review.create({
      data: {
        orderId: order.id,
        authorId: user.id,
        targetId,
        rating: data.rating,
        comment: data.comment || null,
      },
    });

    const targetExecutorProfile = await prisma.executorProfile.findUnique({ where: { userId: targetId } });
    if (targetExecutorProfile) {
      const agg = await prisma.review.aggregate({
        where: { targetId },
        _avg: { rating: true },
        _count: { rating: true },
      });
      await prisma.executorProfile.update({
        where: { userId: targetId },
        data: {
          ratingAvg: agg._avg.rating ?? 0,
          ratingCount: agg._count.rating,
        },
      });
    }

    await createNotification({
      userId: targetId,
      type: "NEW_REVIEW",
      title: "Новый отзыв",
      message: `${user.name} оставил(а) вам отзыв по заказу «${order.job.title}»`,
      link: `/dashboard`,
    });

    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
