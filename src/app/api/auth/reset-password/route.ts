import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { passwordSchema } from "@/lib/validations";
import { rateLimit, clientKey, tooManyRequests } from "@/lib/rate-limit";
import { handleApiError } from "@/lib/api-utils";

const schema = z.object({
  token: z.string().min(1, "Ссылка недействительна"),
  password: passwordSchema,
});

export async function POST(req: NextRequest) {
  try {
    const limit = rateLimit(clientKey(req, "reset"), 10, 15 * 60 * 1000);
    if (!limit.allowed) return tooManyRequests(limit.retryAfter);

    const { token, password } = schema.parse(await req.json());

    const record = await prisma.passwordResetToken.findUnique({
      where: { tokenHash: createHash("sha256").update(token).digest("hex") },
      include: { user: { select: { id: true, isBlocked: true } } },
    });

    const invalid =
      !record || record.usedAt !== null || record.expiresAt < new Date() || record.user.isBlocked;

    if (invalid) {
      return NextResponse.json(
        { error: "Ссылка устарела или уже использована. Запросите восстановление заново." },
        { status: 400 }
      );
    }

    // Пароль и погашение токена — одной транзакцией: иначе при сбое между
    // ними ссылка осталась бы рабочей после смены пароля.
    await prisma.$transaction([
      prisma.user.update({
        where: { id: record.userId },
        data: { passwordHash: await bcrypt.hash(password, 10) },
      }),
      prisma.passwordResetToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
      // Остальные активные ссылки этого пользователя тоже гасим.
      prisma.passwordResetToken.updateMany({
        where: { userId: record.userId, usedAt: null },
        data: { usedAt: new Date() },
      }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
