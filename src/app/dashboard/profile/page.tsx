import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { ROLES } from "@/lib/constants";
import { ProfileForm } from "./profile-form";
import { ExecutorProfileForm } from "./executor-profile-form";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await auth();
  const userId = session!.user.id;

  const [user, executorProfile, categories] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    session!.user.role === ROLES.EXECUTOR
      ? prisma.executorProfile.findUnique({
          where: { userId },
          include: { skills: { include: { skill: true } } },
        })
      : null,
    prisma.category.findMany({ orderBy: { order: "asc" } }),
  ]);

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Профиль</h1>
        <p className="mt-1 text-muted">Управляйте своими данными</p>
      </div>

      <Card>
        <CardContent>
          <CardTitle className="mb-4">Основная информация</CardTitle>
          <ProfileForm user={user} />
        </CardContent>
      </Card>

      {session!.user.role === ROLES.EXECUTOR && (
        <Card>
          <CardContent>
            <CardTitle className="mb-4">Профиль исполнителя</CardTitle>
            <ExecutorProfileForm profile={executorProfile} categories={categories} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
