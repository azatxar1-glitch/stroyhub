/**
 * Русская плюрализация числительных.
 *
 * Формы передаются тройкой: [1 файл, 2 файла, 5 файлов].
 *
 * Правило: смотрим на две последние цифры. Числа 11–14 всегда берут третью
 * форму («11 файлов», а не «11 файл») — это и есть место, где обычно
 * появляется баг.
 */
export type PluralForms = [one: string, few: string, many: string];

export function plural(count: number, forms: PluralForms): string {
  const n = Math.abs(Math.trunc(count));
  const mod100 = n % 100;
  const mod10 = n % 10;

  if (mod100 >= 11 && mod100 <= 14) return forms[2];
  if (mod10 === 1) return forms[0];
  if (mod10 >= 2 && mod10 <= 4) return forms[1];
  return forms[2];
}

/** Число вместе с подходящей формой: «5 файлов». */
export function pluralize(count: number, forms: PluralForms): string {
  return `${count} ${plural(count, forms)}`;
}

/** Формы, которые встречаются в интерфейсе не по одному разу. */
export const FORMS = {
  direction: ["направление", "направления", "направлений"] as PluralForms,
  specialist: ["специалист", "специалиста", "специалистов"] as PluralForms,
  order: ["заказ", "заказа", "заказов"] as PluralForms,
  review: ["отзыв", "отзыва", "отзывов"] as PluralForms,
  proposal: ["отклик", "отклика", "откликов"] as PluralForms,
  job: ["заявка", "заявки", "заявок"] as PluralForms,
  year: ["год", "года", "лет"] as PluralForms,
  day: ["день", "дня", "дней"] as PluralForms,
  work: ["работа", "работы", "работ"] as PluralForms,
  message: ["сообщение", "сообщения", "сообщений"] as PluralForms,
} as const;
