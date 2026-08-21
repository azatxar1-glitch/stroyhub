import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { PortfolioManager } from "./portfolio-manager";

export const dynamic = "force-dynamic";

export default async function PortfolioPage() {
  const session = await auth();
  const profile = await prisma.executorProfile.findUnique({
    where: { userId: session!.user.id },
    include: { portfolioItems: { orderBy: { createdAt: "desc" } } },
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Портфолио</h1>
        <p className="mt-1 text-muted">Покажите заказчикам примеры своих работ</p>
      </div>

      {!profile ? (
        <p className="rounded-xl border border-dashed border-border bg-surface/50 p-6 text-sm text-muted">
          Сначала заполните профиль исполнителя во вкладке «Профиль», чтобы добавлять работы в портфолио.
        </p>
      ) : (
        <PortfolioManager items={profile.portfolioItems} />
      )}
    </div>
  );
}
