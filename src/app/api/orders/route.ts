import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { handleApiError } from "@/lib/api-utils";

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const orders = await prisma.order.findMany({
      where: {
        AND: [
          { OR: [{ customerId: user.id }, { executorId: user.id }] },
          status ? { status } : {},
        ],
      },
      include: {
        job: { select: { id: true, title: true, category: { select: { name: true } } } },
        customer: { select: { id: true, name: true, avatarUrl: true } },
        executor: { select: { id: true, name: true, avatarUrl: true } },
        reviews: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(orders);
  } catch (error) {
    return handleApiError(error);
  }
}
