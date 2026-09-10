/**
 * Проверка почты. Отправляет одно тестовое письмо и печатает,
 * что именно произошло — чтобы не гадать, дошло или нет.
 *
 *   npx tsx scripts/test-email.ts вы@example.com
 *
 * Без RESEND_API_KEY письмо уйдёт в консоль (это штатный режим разработки).
 */
import { sendEmail, emailLayout, isEmailConfigured } from "../src/lib/email";

async function main() {
  const to = process.argv[2];

  if (!to) {
    console.error("Укажите адрес: npx tsx scripts/test-email.ts вы@example.com");
    process.exit(1);
  }

  console.log(isEmailConfigured() ? "Ключ Resend найден." : "Ключа Resend нет — письмо уйдёт в консоль.");
  console.log(`Отправитель: ${process.env.EMAIL_FROM ?? "СтройХаб <onboarding@resend.dev>"}`);
  console.log(`Получатель:  ${to}`);
  console.log("");

  const result = await sendEmail({
    to,
    subject: "Проверка почты — СтройХаб",
    text: [
      "Это тестовое письмо СтройХаба.",
      "",
      "Если вы его видите — отправка настроена правильно:",
      "уведомления об откликах и восстановление пароля будут доходить.",
    ].join("\n"),
    html: emailLayout({
      heading: "Почта настроена",
      body: [
        "Это тестовое письмо СтройХаба.",
        "Если вы его видите — отправка работает: уведомления об откликах и ссылки восстановления пароля будут доходить до пользователей.",
      ],
      action: { label: "Открыть СтройХаб", url: process.env.AUTH_URL ?? "https://stroyhub-g5g5.vercel.app" },
      footer: "Письмо отправлено скриптом scripts/test-email.ts.",
    }),
  });

  if (!result.ok) {
    console.error("Не отправлено:", result.error);
    console.error("");
    console.error("Частые причины:");
    console.error("  • Домен не подтверждён — Resend без своего домена шлёт только");
    console.error("    на адрес, на который зарегистрирован аккаунт.");
    console.error("  • EMAIL_FROM указывает на домен, который вы не подтверждали.");
    console.error("  • Ключ скопирован не полностью.");
    process.exit(1);
  }

  if (result.delivered) {
    console.log("Письмо отправлено. Проверьте входящие и папку «Спам».");
  } else {
    console.log("Ключа нет — содержимое письма напечатано выше.");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
