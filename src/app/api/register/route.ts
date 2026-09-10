import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations";
import { handleApiError } from "@/lib/api-utils";
import { rateLimit, clientKey, tooManyRequests } from "@/lib/rate-limit";
import { LEGAL_VERSION } from "@/lib/legal";

export async function POST(req: NextRequest) {
  try {
    // Регистрация создаёт записи в базе — без лимита её можно завалить ботами.
    const limit = rateLimit(clientKey(req, "register"), 5, 60 * 60 * 1000);
    if (!limit.allowed) return tooManyRequests(limit.retryAfter);

    const body = await req.json();
    const data = registerSchema.parse(body);

    const email = data.email.toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Пользователь с таким email уже зарегистрирован" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email,
        passwordHash,
        role: data.role,
        // Фиксируем момент и редакцию документов: без этого невозможно
        // показать, с чем именно человек согласился.
        consentAt: new Date(),
        consentVersion: LEGAL_VERSION,
      },
    });

    return NextResponse.json({ id: user.id, email: user.email });
  } catch (error) {
    return handleApiError(error);
  }
}
