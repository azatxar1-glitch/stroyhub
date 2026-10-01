import { upload } from "@vercel/blob/client";
import {
  MAX_UPLOAD_SIZE,
  MULTIPART_THRESHOLD,
  UPLOAD_PREFIX,
  checkUpload,
  extensionOf,
} from "@/lib/uploads";

export type UploadedFile = { url: string; filename: string; type: string };

/**
 * Загрузка файла из браузера.
 *
 * Основной путь — прямо в хранилище, минуя наш сервер: тело запроса к
 * функции Vercel ограничено 4.5 МБ, и всё, что тяжелее, раньше падало с
 * невнятной ошибкой уже после ожидания. Сервер в этой схеме только выдаёт
 * недолгий токен и проверяет права.
 *
 * Запасной путь — старый /api/upload, который кладёт файл на диск. Он нужен
 * на локальной машине, где облачного хранилища нет и заводить его ради
 * разработки не хочется.
 */

let storageAvailable: Promise<boolean> | null = null;

function isStorageAvailable(): Promise<boolean> {
  storageAvailable ??= fetch("/api/upload/token")
    .then((r) => (r.ok ? r.json() : { enabled: false }))
    .then((d: { enabled?: boolean }) => Boolean(d.enabled))
    .catch(() => false);
  return storageAvailable;
}

export async function uploadFile(
  file: File,
  onProgress?: (percentage: number) => void
): Promise<UploadedFile> {
  const problem = checkUpload(file);
  if (problem) throw new Error(problem);

  const type = file.type || "application/octet-stream";

  if (await isStorageAvailable()) {
    // Имя задаём сами: пользовательское могло бы содержать что угодно, а так
    // в хранилище лежит один предсказуемый путь на файл.
    const blob = await upload(`${UPLOAD_PREFIX}${crypto.randomUUID()}${extensionOf(file.name)}`, file, {
      access: "public",
      handleUploadUrl: "/api/upload/token",
      contentType: file.type || undefined,
      multipart: file.size > MULTIPART_THRESHOLD,
      onUploadProgress: onProgress ? (p) => onProgress(p.percentage) : undefined,
    });

    return { url: blob.url, filename: file.name, type };
  }

  const form = new FormData();
  form.append("file", file);
  const res = await fetch("/api/upload", { method: "POST", body: form });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Не удалось загрузить файл");
  return data as UploadedFile;
}

export { MAX_UPLOAD_SIZE };
