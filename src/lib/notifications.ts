import { prisma } from "@/lib/prisma";

export async function createNotification(params: {
  userId: string;
  type: string;
  title: string;
  message: string;
  link?: string;
}) {
  return prisma.notification.create({ data: params });
}
