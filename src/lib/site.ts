/**
 * Адрес сайта — один источник правды.
 *
 * Порядок: явно заданный NEXT_PUBLIC_SITE_URL → домен превью-деплоя от
 * Vercel → локальная разработка. Раньше базовый URL был захардкожен в трёх
 * местах и указывал на домен, которого не существует, из-за чего превью
 * ссылок в мессенджерах тянулись с чужого адреса.
 */
function resolveSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/+$/, "");

  // Стабильный домен проекта. VERCEL_URL для продакшена содержит адрес
  // конкретного деплоя с хешем — он меняется при каждой сборке и в
  // canonical попадать не должен.
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }

  // Превью-деплой: адрес есть только у самого деплоя.
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;

  return "http://localhost:3000";
}

export const siteUrl = resolveSiteUrl();

/**
 * Продакшен ли это. На превью-деплоях и локально страницы не должны
 * попадать в поиск — иначе в выдаче окажутся дубли основного сайта.
 */
export const isProduction = process.env.VERCEL_ENV === "production";

/** Абсолютная ссылка от корня сайта. */
export function absoluteUrl(path: string): string {
  return `${siteUrl}${path.startsWith("/") ? path : `/${path}`}`;
}
