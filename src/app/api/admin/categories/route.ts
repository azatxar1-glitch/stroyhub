import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { handleApiError } from "@/lib/api-utils";
import { ROLES } from "@/lib/constants";

const createSchema = z.object({
  name: z.string().min(2).max(80),
  icon: z.string().max(60).optional(),
});

function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-zа-яё0-9\s-]/gi, "")
    .replace(/\s+/g, "-");
}

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { order: "asc" },
      include: { _count: { select: { jobs: true, executorProfiles: true } } },
    });
    return NextResponse.json(categories);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireRole(ROLES.ADMIN);
    const body = await req.json();
    const data = createSchema.parse(body);

    const maxOrder = await prisma.category.aggregate({ _max: { order: true } });
    const category = await prisma.category.create({
      data: {
        name: data.name,
        slug: slugify(data.name),
        icon: data.icon || "MoreHorizontal",
        order: (maxOrder._max.order ?? 0) + 1,
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
