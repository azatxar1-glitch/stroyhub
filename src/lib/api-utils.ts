import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { ApiError } from "@/lib/session";

export function handleApiError(error: unknown) {
  if (error instanceof ApiError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: error.issues[0]?.message ?? "Некорректные данные", issues: error.issues },
      { status: 400 }
    );
  }
  console.error(error);
  return NextResponse.json({ error: "Внутренняя ошибка сервера" }, { status: 500 });
}
