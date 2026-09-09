/**
 * Отправка писем через Resend.
 *
 * Ключа может не быть — на локальной машине или пока почта не подключена.
 * Тогда письмо не теряется молча: оно печатается в консоль сервера, так что
 * ссылку восстановления можно взять оттуда и продолжить работу.
 *
 * Переменные окружения:
 *   RESEND_API_KEY — ключ из resend.com
 *   EMAIL_FROM     — отправитель, например "СтройХаб <noreply@ваш-домен.ru>"
 */

const API_KEY = process.env.RESEND_API_KEY;
const FROM = process.env.EMAIL_FROM ?? "СтройХаб <onboarding@resend.dev>";

export type SendResult = { ok: true; delivered: boolean } | { ok: false; error: string };

export function isEmailConfigured() {
  return Boolean(API_KEY);
}

export async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<SendResult> {
  if (!API_KEY) {
    console.warn(
      [
        "",
        "─".repeat(70),
        "ПОЧТА НЕ НАСТРОЕНА — письмо не отправлено, содержимое ниже.",
        `Кому:  ${to}`,
        `Тема:  ${subject}`,
        "",
        text,
        "─".repeat(70),
        "",
      ].join("\n")
    );
    return { ok: true, delivered: false };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: FROM, to, subject, html, text }),
    });

    if (!response.ok) {
      const body = await response.text();
      console.error("Resend вернул ошибку:", response.status, body);
      return { ok: false, error: `Почтовый сервис ответил ${response.status}` };
    }

    return { ok: true, delivered: true };
  } catch (error) {
    console.error("Не удалось отправить письмо:", error);
    return { ok: false, error: "Почтовый сервис недоступен" };
  }
}

/** Базовый шаблон письма. Инлайновые стили — почтовые клиенты не читают CSS-файлы. */
export function emailLayout({
  heading,
  body,
  action,
  footer,
}: {
  heading: string;
  body: string[];
  action?: { label: string; url: string };
  footer?: string;
}) {
  const paragraphs = body
    .map(
      (p) =>
        `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#374151">${p}</p>`
    )
    .join("");

  const button = action
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0">
         <tr><td style="border-radius:12px;background:#f97316">
           <a href="${action.url}" style="display:inline-block;padding:13px 26px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none">${action.label}</a>
         </td></tr>
       </table>
       <p style="margin:0 0 16px;font-size:13px;line-height:1.6;color:#6b7280">
         Если кнопка не работает, скопируйте ссылку в браузер:<br>
         <span style="color:#9ca3af;word-break:break-all">${action.url}</span>
       </p>`
    : "";

  const note = footer
    ? `<p style="margin:24px 0 0;padding-top:20px;border-top:1px solid #e5e7eb;font-size:13px;line-height:1.6;color:#9ca3af">${footer}</p>`
    : "";

  return `<!doctype html>
<html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:24px;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:520px;margin:0 auto">
    <tr><td style="padding:0 0 20px">
      <span style="font-size:17px;font-weight:800;color:#111827">Строй<span style="color:#f97316">Хаб</span></span>
    </td></tr>
    <tr><td style="padding:28px;background:#ffffff;border:1px solid #e5e7eb;border-radius:16px">
      <h1 style="margin:0 0 16px;font-size:20px;font-weight:800;color:#111827">${heading}</h1>
      ${paragraphs}
      ${button}
      ${note}
    </td></tr>
    <tr><td style="padding:20px 0;font-size:12px;color:#9ca3af">
      СтройХаб — специалисты и услуги строительной отрасли
    </td></tr>
  </table>
</body></html>`;
}
