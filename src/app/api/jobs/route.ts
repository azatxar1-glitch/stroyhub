import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jobCreateSchema } from "@/lib/validations";
import { requireRole } from "@/lib/session";
import { handleApiError } from "@/lib/api-utils";
import { ROLES } from "@/lib/constants";
import type { Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const city = searchParams.get("city");
    const locationType = searchParams.get("locationType");
    const status = searchParams.get("status");
    const q = searchParams.get("q");
    const mine = searchParams.get("mine");
    const budgetMin = searchParams.get("budgetMin");
    const budgetMax = searchParams.get("budgetMax");
    const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
    const pageSize = Math.min(50, Math.max(1, Number(searchParams.get("pageSize") ?? "12")));

    const where: Prisma.JobWhereInput = {};

    if (category) where.category = { slug: category };
    if (city) where.city = { contains: city };
    if (locationType) where.locationType = locationType;
    if (status) where.status = status;
    else if (!mine) where.status = "OPEN";
    if (q) {
      where.OR = [{ title: { contains: q } }, { description: { contains: q } }];
    }
    if (budgetMin || budgetMax) {
      where.budget = {};
      if (budgetMin) where.budget.gte = Number(budgetMin);
      if (budgetMax) where.budget.lte = Number(budgetMax);
    }
    if (mine) where.customerId = mine;

    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where,
        include: {
          category: true,
          customer: { select: { id: true, name: true, avatarUrl: true } },
          _count: { select: { proposals: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.job.count({ where }),
    ]);

    return NextResponse.json({ jobs, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireRole(ROLES.CUSTOMER);
    const body = await req.json();
    const data = jobCreateSchema.parse(body);

    const category = await prisma.category.findUnique({ where: { id: data.categoryId } });
    if (!category) {
      return NextResponse.json({ error: "Категория не найдена" }, { status: 400 });
    }

    const job = await prisma.job.create({
      data: {
        customerId: user.id,
        categoryId: data.categoryId,
        title: data.title,
        description: data.description,
        city: data.city,
        address: data.address || null,
        locationType: data.locationType,
        budget: data.budget ?? null,
        deadline: data.deadline || null,
        attachments: data.attachmentUrls?.length
          ? { create: data.attachmentUrls.map((a) => ({ url: a.url, filename: a.filename, type: a.type })) }
          : undefined,
      },
      include: { attachments: true, category: true },
    });

    return NextResponse.json(job, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
