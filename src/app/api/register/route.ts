import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations";
import { handleApiError } from "@/lib/api-utils";

export async function POST(req: NextRequest) {
  try {
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
      },
    });

    return NextResponse.json({ id: user.id, email: user.email });
  } catch (error) {
    return handleApiError(error);
  }
}
