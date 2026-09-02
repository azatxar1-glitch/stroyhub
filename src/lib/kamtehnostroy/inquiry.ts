/**
 * Заявка с сайта ООО «КАМТЕХНОСТРОЙ».
 *
 * Здесь описана форма данных и единственная точка доставки заявки.
 * Бэкенда пока нет: `deliverInquiry()` только пишет заявку в серверный лог
 * и честно возвращает `delivered: false`. Подключение канала — одно место.
 *
 * Как подключить:
 *   E-mail    — nodemailer / Resend / любой SMTP внутри `deliverInquiry`.
 *   Telegram  — POST на https://api.telegram.org/bot<TOKEN>/sendMessage.
 *   CRM       — POST в amoCRM / Битрикс24 / собственный API.
 *   БД        — в проекте уже есть Prisma: добавьте модель и создайте запись.
 *
 * Секреты храните в переменных окружения (.env), а не в коде.
 */

export type Inquiry = {
  name: string;
  companyName?: string;
  phone: string;
  email: string;
  message: string;
};

export type InquiryErrors = Partial<Record<keyof Inquiry, string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
/** Не менее 10 цифр — так проходят и +7…, и 8…, и запись со скобками. */
const PHONE_DIGITS = 10;

/**
 * Одна и та же проверка используется формой в браузере и API-роутом,
 * чтобы правила не разъезжались.
 */
export function validateInquiry(input: Partial<Inquiry>): InquiryErrors {
  const errors: InquiryErrors = {};

  const name = (input.name ?? "").trim();
  if (name.length < 2) errors.name = "Укажите имя";
  else if (name.length > 100) errors.name = "Слишком длинное имя";

  const phone = (input.phone ?? "").trim();
  const digits = phone.replace(/\D/g, "");
  if (!phone) errors.phone = "Укажите телефон";
  else if (digits.length < PHONE_DIGITS) errors.phone = "Проверьте номер телефона";

  const email = (input.email ?? "").trim();
  if (!email) errors.email = "Укажите e-mail";
  else if (!EMAIL_RE.test(email)) errors.email = "Проверьте адрес e-mail";

  const message = (input.message ?? "").trim();
  if (message.length < 10) errors.message = "Опишите задачу — хотя бы пара предложений";
  else if (message.length > 4000) errors.message = "Слишком длинное описание";

  const companyName = (input.companyName ?? "").trim();
  if (companyName.length > 150) errors.companyName = "Слишком длинное название";

  return errors;
}

export type DeliveryResult = {
  /** true — заявка действительно ушла в почту / Telegram / CRM. */
  delivered: boolean;
  channel: string;
};

export async function deliverInquiry(inquiry: Inquiry): Promise<DeliveryResult> {
  // TODO: подключить реальный канал доставки — см. комментарий выше.
  console.info("[КАМТЕХНОСТРОЙ] Новая заявка с сайта:", {
    ...inquiry,
    receivedAt: new Date().toISOString(),
  });

  return { delivered: false, channel: "log" };
}
