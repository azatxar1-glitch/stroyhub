import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { put } from "@vercel/blob";
import { requireUser } from "@/lib/session";
import { handleApiError } from "@/lib/api-utils";
import { UPLOAD_PREFIX, checkUpload, extensionOf } from "@/lib/uploads";

/**
 * Загрузка через сервер.
 *
 * Основной путь теперь другой: браузер пишет файл прямо в хранилище, получив
 * токен на /api/upload/token. Этот маршрут остаётся по двум причинам. На
 * локальной машине облачного хранилища нет, и файл кладётся на диск в
 * public/uploads. И сразу после выката вкладки со старым скриптом ещё какое-то
 * время приходят сюда.
 *
 * Лимит здесь не наш, а платформы: тело запроса к функции Vercel не может быть
 * больше 4.5 МБ. Именно поэтому большие файлы и ходят мимо.
 */
export async function POST(req: NextRequest) {
  try {
    await requireUser();

    const form = await req.formData();
    const file = form.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "Файл не найден" }, { status: 400 });
    }

    const problem = checkUpload(file);
    if (problem) {
      return NextResponse.json({ error: problem }, { status: 400 });
    }

    const filename = `${randomUUID()}${extensionOf(file.name)}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    let url: string;
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const blob = await put(`${UPLOAD_PREFIX}${filename}`, buffer, {
        access: "public",
        contentType: file.type || undefined,
      });
      url = blob.url;
    } else {
      const uploadsDir = path.join(process.cwd(), "public", "uploads");
      await mkdir(uploadsDir, { recursive: true });
      await writeFile(path.join(uploadsDir, filename), buffer);
      url = `/uploads/${filename}`;
    }

    return NextResponse.json({
      url,
      filename: file.name,
      type: file.type || "application/octet-stream",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
