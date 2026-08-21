import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { handleApiError } from "@/lib/api-utils";
import { ROLES } from "@/lib/constants";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole(ROLES.ADMIN);
    const { id } = await params;
    const job = await prisma.job.findUnique({ where: { id } });
    if (!job) return NextResponse.json({ error: "Заявка не найдена" }, { status: 404 });
    await prisma.job.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
