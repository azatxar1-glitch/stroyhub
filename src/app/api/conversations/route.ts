import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser, ApiError } from "@/lib/session";
import { handleApiError } from "@/lib/api-utils";
import { ROLES } from "@/lib/constants";

export async function GET() {
  try {
    const user = await requireUser();

    const conversations = await prisma.conversation.findMany({
      where: { OR: [{ customerId: user.id }, { executorId: user.id }] },
      include: {
        job: { select: { id: true, title: true } },
        customer: { select: { id: true, name: true, avatarUrl: true } },
        executor: { select: { id: true, name: true, avatarUrl: true } },
        messages: { orderBy: { createdAt: "desc" }, take: 1 },
        _count: {
          select: { messages: { where: { readAt: null, NOT: { senderId: user.id } } } },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const sorted = conversations.sort((a, b) => {
      const at = a.messages[0]?.createdAt ?? a.createdAt;
      const bt = b.messages[0]?.createdAt ?? b.createdAt;
      return new Date(bt).getTime() - new Date(at).getTime();
    });

    return NextResponse.json(sorted);
  } catch (error) {
    return handleApiError(error);
  }
}

const createSchema = z.object({
  otherUserId: z.string().min(1),
  jobId: z.string().optional().nullable(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const { otherUserId, jobId } = createSchema.parse(body);

    if (otherUserId === user.id) throw new ApiError(400, "Нельзя написать самому себе");

    const other = await prisma.user.findUnique({ where: { id: otherUserId } });
    if (!other) throw new ApiError(404, "Пользователь не найден");

    let customerId: string;
    let executorId: string;

    if (user.role === ROLES.CUSTOMER && other.role === ROLES.EXECUTOR) {
      customerId = user.id;
      executorId = other.id;
    } else if (user.role === ROLES.EXECUTOR && other.role === ROLES.CUSTOMER) {
      customerId = other.id;
      executorId = user.id;
    } else {
      throw new ApiError(400, "Чат доступен только между заказчиком и исполнителем");
    }

    // Not using upsert on the compound unique key: SQLite treats NULL jobId
    // values as distinct, so an upsert would create a new row on every call
    // for job-less (direct) conversations instead of reusing the existing one.
    const include = {
      job: { select: { id: true, title: true } },
      customer: { select: { id: true, name: true, avatarUrl: true } },
      executor: { select: { id: true, name: true, avatarUrl: true } },
    } as const;

    const existingConversation = await prisma.conversation.findFirst({
      where: { jobId: jobId ?? null, customerId, executorId },
      include,
    });

    const conversation =
      existingConversation ??
      (await prisma.conversation.create({
        data: { jobId: jobId ?? null, customerId, executorId },
        include,
      }));

    return NextResponse.json(conversation, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
