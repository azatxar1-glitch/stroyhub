/**
 * Реквизиты оператора персональных данных.
 *
 * Заполняются один раз перед запуском. Пустые поля не выводятся на странице
 * (вместо них ничего не рисуется), поэтому в интерфейс не попадают заглушки —
 * но политика без реквизитов оператора юридически неполна, и незаполненные
 * поля перечислены в `missingOperatorFields()`.
 */
export type Operator = {
  legalName: string;
  inn: string;
  ogrn: string;
  address: string;
  email: string;
  phone: string;
};

/* Тип задан явно: с `as const` пустые поля получили бы тип "" и любая
   проверка `operator.phone && …` сузилась бы до never. */
export const operator: Operator = {
  /** Полное наименование юрлица или ФИО ИП. */
  legalName: "",
  /** ИНН. */
  inn: "",
  /** ОГРН / ОГРНИП. */
  ogrn: "",
  /** Юридический адрес. */
  address: "",
  /** Адрес для обращений по персональным данным. */
  email: "",
  /** Телефон — необязателен. */
  phone: "",
};

export const SITE_NAME = "СтройХаб";

/** Дата последней редакции документов. Меняйте при правках текста. */
export const POLICY_UPDATED_AT = "10 сентября 2026 г.";

/**
 * Версия правовых документов. Сохраняется вместе с согласием пользователя,
 * чтобы было видно, с какой именно редакцией он согласился. При изменении
 * текста политики или оферты увеличивайте версию.
 */
export const LEGAL_VERSION = "2026-09-10";

/** Какие обязательные реквизиты ещё не заполнены. */
export function missingOperatorFields(): string[] {
  const required: [keyof typeof operator, string][] = [
    ["legalName", "наименование оператора"],
    ["inn", "ИНН"],
    ["address", "адрес"],
    ["email", "email для обращений"],
  ];
  return required.filter(([key]) => !operator[key]).map(([, label]) => label);
}

export function hasOperatorDetails(): boolean {
  return missingOperatorFields().length === 0;
}
