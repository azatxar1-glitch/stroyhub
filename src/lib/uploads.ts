/**
 * Ограничения загрузки — один источник правды для браузера и сервера.
 *
 * Потолок в 100 МБ держится только на клиентской загрузке: файл идёт из
 * браузера прямо в хранилище. Серверный маршрут /api/upload оставлен для
 * локальной разработки, и там действует лимит самой платформы — тело
 * запроса к функции Vercel не может превышать 4.5 МБ.
 */

export const MAX_UPLOAD_SIZE = 100 * 1024 * 1024;

/** Выше этого порога файл грузится частями: их можно слать параллельно и переотправлять поштучно. */
export const MULTIPART_THRESHOLD = 8 * 1024 * 1024;

/** Всё, что кладём в хранилище, живёт под этим префиксом. */
export const UPLOAD_PREFIX = "uploads/";

export const ALLOWED_EXTENSIONS = [
  ".jpg", ".jpeg", ".png", ".webp", ".gif",
  ".pdf", ".doc", ".docx", ".xls", ".xlsx",
  ".dwg", ".zip",
] as const;

/** Расширение в нижнем регистре, вместе с точкой. Пустая строка, если его нет. */
export function extensionOf(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot === -1 ? "" : name.slice(dot).toLowerCase();
}

export function isAllowedExtension(name: string): boolean {
  return (ALLOWED_EXTENSIONS as readonly string[]).includes(extensionOf(name));
}

export function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${Math.round(bytes / (1024 * 1024))} МБ`;
  return `${Math.max(1, Math.round(bytes / 1024))} КБ`;
}

/**
 * Проверка до отправки: вернёт текст ошибки или null.
 *
 * Те же правила повторяются на сервере — здесь они нужны, чтобы человек
 * узнал о проблеме сразу, а не после загрузки стомегабайтного файла.
 */
export function checkUpload(file: { name: string; size: number }): string | null {
  if (!isAllowedExtension(file.name)) {
    return "Такой тип файла загрузить нельзя: подойдут изображения, PDF, документы Word и Excel, DWG или ZIP";
  }
  if (file.size > MAX_UPLOAD_SIZE) {
    return `Файл весит ${formatSize(file.size)}, а максимум — ${formatSize(MAX_UPLOAD_SIZE)}`;
  }
  if (file.size === 0) return "Файл пустой";
  return null;
}
