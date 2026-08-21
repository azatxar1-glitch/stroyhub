import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function getCurrentUser() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || user.isBlocked) return null;
  return user;
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new ApiError(401, "Требуется авторизация");
  return user;
}

export async function requireRole(role: string | string[]) {
  const user = await requireUser();
  const roles = Array.isArray(role) ? role : [role];
  if (!roles.includes(user.role)) throw new ApiError(403, "Недостаточно прав");
  return user;
}
