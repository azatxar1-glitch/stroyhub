/**
 * Отправка целей в Яндекс Метрику.
 *
 * Цели вешаем на действия, а не на адреса страниц: отклик и регистрация
 * происходят без перехода на отдельный URL, и по страницам их не поймать.
 *
 * Если счётчика нет (локальная разработка), вызовы тихо ничего не делают —
 * проверять это на каждой кнопке не нужно.
 */

export const metricaCounterId = process.env.NEXT_PUBLIC_YANDEX_METRICA_ID;

declare global {
  interface Window {
    ym?: (id: number, action: string, ...args: unknown[]) => void;
  }
}

/** Идентификаторы целей. Те же строки заведены в интерфейсе Метрики. */
export const GOALS = {
  signup: "signup",
  jobCreated: "job_created",
  proposalSent: "proposal_sent",
} as const;

export type Goal = (typeof GOALS)[keyof typeof GOALS];

export function reachGoal(goal: Goal, params?: Record<string, unknown>) {
  if (!metricaCounterId) return;
  window.ym?.(Number(metricaCounterId), "reachGoal", goal, params);
}
