/**
 * Выгрузка всей базы в один JSON-файл.
 *
 * Нужна перед любой правкой боевых данных: бесплатный тариф Neon не даёт
 * восстановления на момент времени, поэтому единственная страховка — снимок,
 * снятый руками.
 *
 *   npx tsx scripts/backup-db.ts
 *
 * Файл кладётся в `backups/` (папка не коммитится — внутри персональные данные).
 */
import { mkdirSync, writeFileSync } from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const [
    users,
    executorProfiles,
    categories,
    skills,
    executorSkills,
    portfolioItems,
    jobs,
    jobAttachments,
    proposals,
    conversations,
    messages,
    orders,
    reviews,
    notifications,
    complaints,
  ] = await Promise.all([
    prisma.user.findMany(),
    prisma.executorProfile.findMany(),
    prisma.category.findMany(),
    prisma.skill.findMany(),
    prisma.executorSkill.findMany(),
    prisma.portfolioItem.findMany(),
    prisma.job.findMany(),
    prisma.jobAttachment.findMany(),
    prisma.proposal.findMany(),
    prisma.conversation.findMany(),
    prisma.message.findMany(),
    prisma.order.findMany(),
    prisma.review.findMany(),
    prisma.notification.findMany(),
    prisma.complaint.findMany(),
  ]);

  const dump = {
    takenAt: new Date().toISOString(),
    users,
    executorProfiles,
    categories,
    skills,
    executorSkills,
    portfolioItems,
    jobs,
    jobAttachments,
    proposals,
    conversations,
    messages,
    orders,
    reviews,
    notifications,
    complaints,
  };

  const dir = path.join(process.cwd(), "backups");
  mkdirSync(dir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const file = path.join(dir, `stroyhub-${stamp}.json`);
  writeFileSync(file, JSON.stringify(dump, null, 2), "utf-8");

  const counts = Object.entries(dump)
    .filter(([, v]) => Array.isArray(v))
    .map(([k, v]) => `${k}: ${(v as unknown[]).length}`)
    .join(", ");

  console.log(`Снимок сохранён: ${file}`);
  console.log(counts);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
