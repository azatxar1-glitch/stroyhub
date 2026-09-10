import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/api-utils";
import { rateLimit, clientKey, tooManyRequests } from "@/lib/rate-limit";

const schema = z.object({
  email: z.string().email("Некорректный email"),
  categorySlug: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const limit = rateLimit(clientKey(req, "lead"), 10, 60 * 60 * 1000);
    if (!limit.allowed) return tooManyRequests(limit.retryAfter);

    const { email, categorySlug } = schema.parse(await req.json());

    const category = await prisma.category.findUnique({
      where: { slug: categorySlug },
      select: { id: true },
    });
    if (!category) {
      return NextResponse.json({ error: "Направление не найдено" }, { status: 404 });
    }

    // Повторная подписка тем же адресом — не ошибка: человек мог забыть,
    // что уже подписывался, и получать за это отказ незачем.
    await prisma.categoryLead.upsert({
      where: { email_categoryId: { email: email.toLowerCase().trim(), categoryId: category.id } },
      update: {},
      create: { email: email.toLowerCase().trim(), categoryId: category.id },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
