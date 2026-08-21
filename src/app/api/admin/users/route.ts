import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { handleApiError } from "@/lib/api-utils";
import { ROLES } from "@/lib/constants";
import type { Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    await requireRole(ROLES.ADMIN);
    const { searchParams } = new URL(req.url);
    const role = searchParams.get("role");
    const q = searchParams.get("q");

    const where: Prisma.UserWhereInput = {};
    if (role) where.role = role;
    if (q) where.OR = [{ name: { contains: q } }, { email: { contains: q } }];

    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        city: true,
        isBlocked: true,
        createdAt: true,
        _count: { select: { jobs: true, proposals: true } },
      },
    });

    return NextResponse.json(users);
  } catch (error) {
    return handleApiError(error);
  }
}
