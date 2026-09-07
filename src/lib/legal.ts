/**
 * Реквизиты оператора персональных данных.
 *
 * Заполняются один раз перед запуском. Пустые поля не выводятся на странице
 * (вместо них ничего не рисуется), поэтому в интерфейс не попадают заглушки —
 * но политика без реквизитов оператора юридически неполна, и незаполненные
 * поля перечислены в `missingOperatorFields()`.
 */
export const operator = {
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
} as const;

export const SITE_NAME = "СтройХаб";

/** Дата последней редакции документа. Меняйте при правках текста. */
export const POLICY_UPDATED_AT = "7 сентября 2026 г.";

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
