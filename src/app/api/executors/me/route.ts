import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { executorProfileSchema } from "@/lib/validations";
import { requireRole } from "@/lib/session";
import { handleApiError } from "@/lib/api-utils";
import { ROLES } from "@/lib/constants";

export async function GET() {
  try {
    const user = await requireRole(ROLES.EXECUTOR);
    const profile = await prisma.executorProfile.findUnique({
      where: { userId: user.id },
      include: { category: true, skills: { include: { skill: true } }, portfolioItems: true },
    });
    return NextResponse.json(profile);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await requireRole(ROLES.EXECUTOR);
    const body = await req.json();
    const data = executorProfileSchema.parse(body);

    const skillNames = Array.from(new Set((data.skillNames ?? []).map((s) => s.trim()).filter(Boolean)));
    const skills = await Promise.all(
      skillNames.map((name) =>
        prisma.skill.upsert({ where: { name }, create: { name }, update: {} })
      )
    );

    const baseData = {
      categoryId: data.categoryId,
      headline: data.headline,
      description: data.description || null,
      experienceYears: data.experienceYears,
      remoteAvailable: data.remoteAvailable,
      priceFrom: data.priceFrom ?? null,
      availability: data.availability,
    };

    const profile = await prisma.executorProfile.upsert({
      where: { userId: user.id },
      create: { userId: user.id, ...baseData },
      update: baseData,
    });

    await prisma.executorSkill.deleteMany({ where: { executorProfileId: profile.id } });
    if (skills.length) {
      await prisma.executorSkill.createMany({
        data: skills.map((s) => ({ executorProfileId: profile.id, skillId: s.id })),
      });
    }

    const full = await prisma.executorProfile.findUnique({
      where: { id: profile.id },
      include: { category: true, skills: { include: { skill: true } }, portfolioItems: true },
    });

    return NextResponse.json(full);
  } catch (error) {
    return handleApiError(error);
  }
}
