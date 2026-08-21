import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { userProfileSchema } from "@/lib/validations";
import { requireUser } from "@/lib/session";
import { handleApiError } from "@/lib/api-utils";

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const data = userProfileSchema.parse(body);

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: data.name,
        phone: data.phone || null,
        city: data.city || null,
        bio: data.bio || null,
        ...(data.avatarUrl ? { avatarUrl: data.avatarUrl } : {}),
      },
    });

    return NextResponse.json({
      id: updated.id,
      name: updated.name,
      phone: updated.phone,
      city: updated.city,
      bio: updated.bio,
      avatarUrl: updated.avatarUrl,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
