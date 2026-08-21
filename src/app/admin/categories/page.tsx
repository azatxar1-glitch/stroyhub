import { prisma } from "@/lib/prisma";
import { CategoriesManager } from "./categories-manager";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const categories = await prisma.category.findMany({
    orderBy: { order: "asc" },
    include: { _count: { select: { jobs: true, executorProfiles: true } } },
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Категории</h1>
        <p className="mt-1 text-muted">Управление специализациями исполнителей</p>
      </div>
      <CategoriesManager categories={categories} />
    </div>
  );
}
