import { prisma } from "@/lib/prisma";
import { sendEmail, emailLayout } from "@/lib/email";
import { absoluteUrl } from "@/lib/site";

/** Типы, о которых имеет смысл писать на почту. */
const EMAILED_TYPES = new Set([
  "PROPOSAL_RECEIVED",
  "PROPOSAL_ACCEPTED",
  "PROPOSAL_REJECTED",
  "NEW_MESSAGE",
  "ORDER_STATUS_CHANGED",
  "NEW_REVIEW",
]);

/**
 * Переписка идёт очередями сообщений, и письмо на каждое превращается в спам.
 * Поэтому по одному диалогу пишем не чаще раза в полчаса — остальное человек
 * увидит, когда откроет чат.
 */
const MESSAGE_EMAIL_COOLDOWN_MS = 30 * 60 * 1000;

async function shouldEmail(userId: string, type: string, link?: string): Promise<boolean> {
  if (!EMAILED_TYPES.has(type)) return false;
  if (type !== "NEW_MESSAGE") return true;

  const recent = await prisma.notification.findFirst({
    where: {
      userId,
      type: "NEW_MESSAGE",
      link,
      createdAt: { gte: new Date(Date.now() - MESSAGE_EMAIL_COOLDOWN_MS) },
    },
    select: { id: true },
  });

  return recent === null;
}

export async function createNotification(params: {
  userId: string;
  type: string;
  title: string;
  message: string;
  link?: string;
}) {
  const notifyByEmail = await shouldEmail(params.userId, params.type, params.link);

  const notification = await prisma.notification.create({ data: params });

  if (notifyByEmail) {
    // Письмо — побочный эффект: его сбой не должен ломать основное действие
    // (отклик, сообщение, смену статуса), поэтому ошибки только логируем.
    void sendNotificationEmail(params).catch((error) => {
      console.error("Не удалось отправить письмо-уведомление:", error);
    });
  }

  return notification;
}

async function sendNotificationEmail(params: {
  userId: string;
  title: string;
  message: string;
  link?: string;
}) {
  const user = await prisma.user.findUnique({
    where: { id: params.userId },
    select: { email: true, name: true, isBlocked: true, emailNotifications: true },
  });

  if (!user || user.isBlocked || !user.emailNotifications) return;

  const url = absoluteUrl(params.link ?? "/dashboard");

  await sendEmail({
    to: user.email,
    subject: `${params.title} — СтройХаб`,
    text: [
      `Здравствуйте, ${user.name}!`,
      "",
      params.message,
      "",
      `Открыть: ${url}`,
      "",
      `Отключить письма: ${origin}/dashboard/profile`,
    ].join("\n"),
    html: emailLayout({
      heading: params.title,
      body: [`Здравствуйте, ${user.name}!`, params.message],
      action: { label: "Открыть в СтройХабе", url },
      footer: `Письмо пришло, потому что вы зарегистрированы на СтройХабе. Отключить уведомления на почту можно <a href="${origin}/dashboard/profile" style="color:#6b7280">в настройках профиля</a>.`,
    }),
  });
}
