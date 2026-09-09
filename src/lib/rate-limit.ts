/**
 * Ограничение частоты запросов.
 *
 * Счётчики живут в памяти процесса. На serverless это означает, что при
 * нескольких экземплярах лимит считается для каждого отдельно, а при простое
 * сбрасывается — то есть это заслон от перебора и случайного флуда, а не
 * строгая квота. Для строгой нужен общий стор (Redis/Upstash).
 */

type Entry = { count: number; resetAt: number };

const buckets = new Map<string, Entry>();

/** Раз в 5 минут выкидываем протухшие записи, чтобы карта не росла бесконечно. */
let lastSweep = Date.now();
function sweep(now: number) {
  if (now - lastSweep < 300_000) return;
  lastSweep = now;
  for (const [key, entry] of buckets) {
    if (entry.resetAt <= now) buckets.delete(key);
  }
}

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  /** Через сколько секунд можно повторить. */
  retryAfter: number;
};

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  sweep(now);

  const entry = buckets.get(key);

  if (!entry || entry.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, retryAfter: 0 };
  }

  entry.count += 1;

  if (entry.count > limit) {
    return { allowed: false, remaining: 0, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }

  return { allowed: true, remaining: limit - entry.count, retryAfter: 0 };
}

/**
 * IP клиента. За прокси Vercel настоящий адрес приходит в x-forwarded-for;
 * если заголовка нет, все запросы попадут в общее ведро — это осознанный
 * компромисс, лучше чем не ограничивать вовсе.
 */
export function clientKey(req: Request, prefix: string): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
  return `${prefix}:${ip}`;
}

/** Ответ 429 с заголовком Retry-After. */
export function tooManyRequests(retryAfter: number) {
  return Response.json(
    { error: `Слишком много попыток. Попробуйте через ${retryAfter} сек.` },
    { status: 429, headers: { "Retry-After": String(retryAfter) } }
  );
}
