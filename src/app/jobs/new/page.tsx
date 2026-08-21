import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { CreateJobWizard } from "./create-job-wizard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Создать заявку",
  description:
    "Опишите строительную задачу — категория, объект, срок и бюджет. Специалисты откликнутся с конкретной ценой и сроком выполнения.",
  robots: { index: false, follow: true },
};

export default async function NewJobPage() {
  const categories = await prisma.category.findMany({ orderBy: { order: "asc" } });

  return (
    <div className="container-page max-w-3xl py-8 sm:py-12">
      <header className="mb-8 text-center">
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">Создать заявку</h1>
        <p className="mt-2.5 text-muted">
          Семь коротких шагов — и специалисты начнут откликаться с ценой и сроком
        </p>
      </header>

      <CreateJobWizard categories={categories} />
    </div>
  );
}
