/**
 * Trust signals are derived strictly from data we actually store — no
 * placeholder or invented verification. Each signal states the rule it
 * represents, so a badge can never claim more than the record supports.
 */

export type TrustInput = {
  phone?: string | null;
  ratingAvg?: number;
  ratingCount?: number;
  completedOrders?: number;
  description?: string | null;
  skillsCount?: number;
  portfolioCount?: number;
};

export type TrustSignal = {
  key: string;
  label: string;
  /** Shown as a title attribute so the badge's basis is inspectable. */
  detail: string;
  tone: "success" | "info" | "default";
};

/**
 * "Проверенный" here means: completed at least one order on the platform and
 * holds a 4.5+ average across real reviews. It is a platform track record,
 * not an identity/document check — the wording and tooltip stay honest about that.
 */
export function isVerifiedExecutor(input: TrustInput): boolean {
  return (input.completedOrders ?? 0) > 0 && (input.ratingCount ?? 0) > 0 && (input.ratingAvg ?? 0) >= 4.5;
}

export function isProfileComplete(input: TrustInput): boolean {
  return Boolean(input.description?.trim()) && (input.skillsCount ?? 0) > 0;
}

export function getTrustSignals(input: TrustInput): TrustSignal[] {
  const signals: TrustSignal[] = [];

  if (isVerifiedExecutor(input)) {
    signals.push({
      key: "verified",
      label: "Проверенный специалист",
      detail: "Выполнил заказы на площадке и имеет рейтинг 4.5+ по реальным отзывам",
      tone: "success",
    });
  }

  if ((input.completedOrders ?? 0) > 0) {
    const n = input.completedOrders!;
    signals.push({
      key: "orders",
      label: `Выполнено ${n} ${pluralOrders(n)}`,
      detail: "Количество заказов, завершённых через СтройХаб",
      tone: "info",
    });
  }

  if ((input.ratingCount ?? 0) > 0) {
    const n = input.ratingCount!;
    signals.push({
      key: "reviews",
      label: `${n} ${pluralReviews(n)}`,
      detail: "Отзывы оставлены заказчиками после завершения заказа",
      tone: "info",
    });
  }

  if (isProfileComplete(input)) {
    signals.push({
      key: "profile",
      label: "Профиль заполнен",
      detail: "Указаны описание, специализация и навыки",
      tone: "default",
    });
  }

  if (input.phone?.trim()) {
    signals.push({
      key: "phone",
      label: "Телефон указан",
      detail: "Специалист оставил контактный телефон в профиле",
      tone: "default",
    });
  }

  if ((input.portfolioCount ?? 0) > 0) {
    const n = input.portfolioCount!;
    signals.push({
      key: "portfolio",
      label: `Портфолио: ${n} ${pluralWorks(n)}`,
      detail: "Загруженные примеры выполненных работ",
      tone: "default",
    });
  }

  return signals;
}

function pluralOrders(n: number) {
  return plural(n, "заказ", "заказа", "заказов");
}
function pluralReviews(n: number) {
  return plural(n, "отзыв", "отзыва", "отзывов");
}
function pluralWorks(n: number) {
  return plural(n, "работа", "работы", "работ");
}

export function plural(n: number, one: string, few: string, many: string) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
  return many;
}
