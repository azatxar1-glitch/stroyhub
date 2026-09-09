import { createHash, randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendEmail, emailLayout } from "@/lib/email";
import { rateLimit, clientKey, tooManyRequests } from "@/lib/rate-limit";
import { handleApiError } from "@/lib/api-utils";

const schema = z.object({ email: z.string().email("Некорректный email") });

/** Ссылка живёт час: достаточно, чтобы дойти до почты, мало для перебора. */
const TTL_MS = 60 * 60 * 1000;

export async function POST(req: NextRequest) {
  try {
    const limit = rateLimit(clientKey(req, "forgot"), 5, 15 * 60 * 1000);
    if (!limit.allowed) return tooManyRequests(limit.retryAfter);

    const { email } = schema.parse(await req.json());

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: { id: true, name: true, email: true, isBlocked: true },
    });

    // Ответ одинаковый в любом случае: иначе форма превращается в способ
    // проверить, зарегистрирован ли человек на сайте.
    if (user && !user.isBlocked) {
      // Прошлые неиспользованные ссылки гасим — активной должна быть одна.
      await prisma.passwordResetToken.updateMany({
        where: { userId: user.id, usedAt: null },
        data: { usedAt: new Date() },
      });

      const token = randomBytes(32).toString("base64url");
      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash: createHash("sha256").update(token).digest("hex"),
          expiresAt: new Date(Date.now() + TTL_MS),
        },
      });

      const origin = process.env.AUTH_URL ?? new URL(req.url).origin;
      const url = `${origin}/reset-password?token=${token}`;

      await sendEmail({
        to: user.email,
        subject: "Восстановление пароля — СтройХаб",
        text: [
          `Здравствуйте, ${user.name}!`,
          "",
          "Чтобы задать новый пароль, откройте ссылку:",
          url,
          "",
          "Ссылка действует час и сработает один раз.",
          "Если вы не запрашивали восстановление — просто игнорируйте письмо, пароль останется прежним.",
        ].join("\n"),
        html: emailLayout({
          heading: "Восстановление пароля",
          body: [
            `Здравствуйте, ${user.name}!`,
            "Вы запросили смену пароля в СтройХабе. Нажмите кнопку, чтобы задать новый.",
          ],
          action: { label: "Задать новый пароль", url },
          footer:
            "Ссылка действует час и сработает один раз. Если вы не запрашивали восстановление, просто игнорируйте письмо — пароль останется прежним.",
        }),
      });
    }

    return NextResponse.json({
      ok: true,
      message: "Если аккаунт с таким email существует, письмо со ссылкой уже отправлено.",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
