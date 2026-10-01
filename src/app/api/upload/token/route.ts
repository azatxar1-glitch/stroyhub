import { NextRequest, NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { requireUser, ApiError } from "@/lib/session";
import { handleApiError } from "@/lib/api-utils";
import { MAX_UPLOAD_SIZE, UPLOAD_PREFIX, isAllowedExtension } from "@/lib/uploads";

/**
 * Выдача короткоживущего токена для загрузки прямо из браузера в хранилище.
 *
 * Файл сюда не попадает — только путь, под которым браузер собирается его
 * записать. Поэтому проверяем здесь то, что ещё можно проверить: кто грузит
 * и куда. Размер проверит само хранилище по maximumSizeInBytes.
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as HandleUploadBody;

    // Проверки стоят до handleUpload намеренно: он заворачивает чужие
    // исключения в свои, и вместо «требуется авторизация» наружу уходило
    // бы 500 без объяснения.
    if (body.type === "blob.generate-client-token") {
      await requireUser();

      // Имя файла придумывает браузер, так что путь проверяем целиком:
      // префикс, расширение и отсутствие обходов вроде "uploads/../".
      const { pathname } = body.payload;
      const suspicious = pathname.includes("..") || pathname.includes("//");
      if (suspicious || !pathname.startsWith(UPLOAD_PREFIX) || !isAllowedExtension(pathname)) {
        throw new ApiError(400, "Недопустимый путь загрузки");
      }
    }

    const result = await handleUpload({
      request: req,
      body,
      onBeforeGenerateToken: async () => ({
        maximumSizeInBytes: MAX_UPLOAD_SIZE,
        // Имя уже содержит uuid, второй случайный хвост ни к чему.
        addRandomSuffix: false,
        // Тип не ограничиваем: у DWG и архивов браузер присылает пустой или
        // неожиданный MIME, и белый список резал бы живые файлы. Отсекает
        // расширение выше, а раздаются файлы с отдельного домена, так что на
        // наш origin содержимое повлиять не может.
      }),
    });

    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Есть ли облачное хранилище. Браузер спрашивает это перед первой загрузкой,
 * чтобы на локальной машине уйти на запасной путь через /api/upload.
 */
export function GET() {
  return NextResponse.json({ enabled: Boolean(process.env.BLOB_READ_WRITE_TOKEN) });
}
