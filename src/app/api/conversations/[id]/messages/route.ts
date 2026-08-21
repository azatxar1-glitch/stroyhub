import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { messageSchema } from "@/lib/validations";
import { requireUser, ApiError } from "@/lib/session";
import { handleApiError } from "@/lib/api-utils";
import { createNotification } from "@/lib/notifications";

async function assertParticipant(conversationId: string, userId: string) {
  const conversation = await prisma.conversation.findUnique({ where: { id: conversationId } });
  if (!conversation) throw new ApiError(404, "Диалог не найден");
  if (conversation.customerId !== userId && conversation.executorId !== userId) {
    throw new ApiError(403, "Нет доступа к этому диалогу");
  }
  return conversation;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await requireUser();
    const conversation = await assertParticipant(id, user.id);

    const messages = await prisma.message.findMany({
      where: { conversationId: id },
      orderBy: { createdAt: "asc" },
      include: { sender: { select: { id: true, name: true, avatarUrl: true } } },
    });

    await prisma.message.updateMany({
      where: { conversationId: id, senderId: { not: user.id }, readAt: null },
      data: { readAt: new Date() },
    });

    return NextResponse.json({ messages, conversation });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await requireUser();
    const conversation = await assertParticipant(id, user.id);

    const body = await req.json();
    const { text } = messageSchema.parse(body);

    const message = await prisma.message.create({
      data: { conversationId: id, senderId: user.id, text },
      include: { sender: { select: { id: true, name: true, avatarUrl: true } } },
    });

    const recipientId = conversation.customerId === user.id ? conversation.executorId : conversation.customerId;
    await createNotification({
      userId: recipientId,
      type: "NEW_MESSAGE",
      title: "Новое сообщение",
      message: `${user.name}: ${text.slice(0, 80)}`,
      link: `/messages/${id}`,
    });

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
