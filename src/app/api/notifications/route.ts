import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { handleApiError } from "@/lib/api-utils";

export async function GET() {
  try {
    const user = await requireUser();
    const notifications = await prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 30,
    });
    const unreadCount = await prisma.notification.count({ where: { userId: user.id, isRead: false } });
    return NextResponse.json({ notifications, unreadCount });
  } catch (error) {
    return handleApiError(error);
  }
}

const patchSchema = z.object({
  ids: z.array(z.string()).optional(),
  markAll: z.boolean().optional(),
});

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const { ids, markAll } = patchSchema.parse(body);

    await prisma.notification.updateMany({
      where: {
        userId: user.id,
        ...(markAll ? {} : { id: { in: ids ?? [] } }),
      },
      data: { isRead: true },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
