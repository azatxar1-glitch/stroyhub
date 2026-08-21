import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/api-utils";
import type { Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const city = searchParams.get("city");
    const remote = searchParams.get("remote");
    const priceMax = searchParams.get("priceMax");
    const minExperience = searchParams.get("minExperience");
    const minRating = searchParams.get("minRating");
    const q = searchParams.get("q");
    const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
    const pageSize = Math.min(50, Math.max(1, Number(searchParams.get("pageSize") ?? "12")));

    const where: Prisma.ExecutorProfileWhereInput = {};
    if (category) where.category = { slug: category };
    if (remote === "true") where.remoteAvailable = true;
    if (priceMax) where.priceFrom = { lte: Number(priceMax) };
    if (minExperience) where.experienceYears = { gte: Number(minExperience) };
    if (minRating) where.ratingAvg = { gte: Number(minRating) };
    if (city) where.user = { city: { contains: city } };
    if (q) {
      where.OR = [
        { headline: { contains: q } },
        { user: { name: { contains: q } } },
      ];
    }

    const [executors, total] = await Promise.all([
      prisma.executorProfile.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, avatarUrl: true, city: true } },
          category: true,
          skills: { include: { skill: true } },
        },
        orderBy: [{ ratingAvg: "desc" }, { completedOrders: "desc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.executorProfile.count({ where }),
    ]);

    return NextResponse.json({ executors, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
  } catch (error) {
    return handleApiError(error);
  }
}
