/**
 * Смена пароля пользователя вручную.
 *
 * Пока в проекте нет восстановления пароля, это единственный способ вернуть
 * доступ к аккаунту — и способ сменить пароль администратора, не трогая БД
 * напрямую.
 *
 *   npx tsx scripts/set-password.ts admin@stroyhub.ru "новый-пароль"
 *
 * Без второго аргумента пароль генерируется случайно и печатается один раз.
 */
import { randomBytes } from "crypto";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const [email, provided] = process.argv.slice(2);

  if (!email) {
    console.error('Укажите email: npx tsx scripts/set-password.ts user@example.com "пароль"');
    process.exit(1);
  }

  const user = await prisma.user.findUnique({ where: { email }, select: { id: true, name: true, role: true } });
  if (!user) {
    console.error(`Пользователь ${email} не найден`);
    process.exit(1);
  }

  const password = provided ?? randomBytes(12).toString("base64url");
  if (password.length < 6) {
    console.error("Пароль короче 6 символов — форма входа такой не примет");
    process.exit(1);
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await bcrypt.hash(password, 10) },
  });

  console.log(`Пароль обновлён: ${user.name} <${email}> (${user.role})`);
  if (!provided) {
    console.log("");
    console.log(`  ${password}`);
    console.log("");
    console.log("Сохраните его — второй раз он не покажется.");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
