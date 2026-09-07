/**
 * Очистка всех пользовательских данных перед запуском.
 *
 * Удаляет пользователей и всё, что они создали: профили, заявки, отклики,
 * заказы, переписку, отзывы, жалобы, уведомления. Справочники (категории и
 * навыки) остаются — без них сайт не работает.
 *
 * Затем создаёт единственного администратора со случайным паролем, который
 * печатается один раз.
 *
 *   npx tsx scripts/reset-users.ts admin@example.com --yes
 *
 * Без `--yes` скрипт только показывает, что будет удалено, и ничего не трогает.
 * Перед запуском снимите снимок: `npx tsx scripts/backup-db.ts`.
 */
import { randomBytes } from "crypto";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);
  const confirmed = args.includes("--yes");
  const adminEmail = args.find((a) => a.includes("@"));

  if (!adminEmail) {
    console.error("Укажите email администратора: npx tsx scripts/reset-users.ts admin@example.com --yes");
    process.exit(1);
  }

  const [users, jobs, proposals, orders, messages, reviews, complaints, notifications] = await Promise.all([
    prisma.user.count(),
    prisma.job.count(),
    prisma.proposal.count(),
    prisma.order.count(),
    prisma.message.count(),
    prisma.review.count(),
    prisma.complaint.count(),
    prisma.notification.count(),
  ]);

  console.log("Будет удалено:");
  console.log(`  пользователей: ${users}`);
  console.log(`  заявок:        ${jobs}`);
  console.log(`  откликов:      ${proposals}`);
  console.log(`  заказов:       ${orders}`);
  console.log(`  сообщений:     ${messages}`);
  console.log(`  отзывов:       ${reviews}`);
  console.log(`  жалоб:         ${complaints}`);
  console.log(`  уведомлений:   ${notifications}`);
  console.log("");
  console.log(`Останутся: категории, навыки. Будет создан админ ${adminEmail}.`);

  if (!confirmed) {
    console.log("");
    console.log("Это была проверка. Добавьте --yes, чтобы выполнить.");
    return;
  }

  console.log("");
  console.log("Удаление...");

  // Порядок важен: сначала то, что ссылается на другие записи.
  await prisma.$transaction([
    prisma.review.deleteMany(),
    prisma.message.deleteMany(),
    prisma.conversation.deleteMany(),
    prisma.notification.deleteMany(),
    prisma.complaint.deleteMany(),
    prisma.order.deleteMany(),
    prisma.proposal.deleteMany(),
    prisma.jobAttachment.deleteMany(),
    prisma.job.deleteMany(),
    prisma.portfolioItem.deleteMany(),
    prisma.executorSkill.deleteMany(),
    prisma.executorProfile.deleteMany(),
    prisma.account.deleteMany(),
    prisma.session.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  const password = randomBytes(12).toString("base64url");
  const admin = await prisma.user.create({
    data: {
      name: "Администратор",
      email: adminEmail,
      passwordHash: await bcrypt.hash(password, 10),
      role: "ADMIN",
    },
  });

  const categories = await prisma.category.count();

  console.log("Готово.");
  console.log("—".repeat(60));
  console.log(`Администратор: ${admin.email}`);
  console.log(`Пароль:        ${password}`);
  console.log("");
  console.log(`Категорий в справочнике: ${categories}`);
  console.log("—".repeat(60));
  console.log("Сохраните пароль — второй раз он не покажется.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
