import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { ROLES } from "@/lib/constants";
import { EditJobForm } from "./edit-job-form";

export default async function EditJobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session) redirect(`/login?callbackUrl=/jobs/${id}/edit`);

  const job = await prisma.job.findUnique({ where: { id } });
  if (!job) notFound();

  if (job.customerId !== session.user.id && session.user.role !== ROLES.ADMIN) {
    redirect(`/jobs/${id}`);
  }

  const categories = await prisma.category.findMany({ orderBy: { order: "asc" } });

  return (
    <div className="container-page max-w-2xl py-10">
      <h1 className="text-2xl font-bold text-foreground">Редактировать заявку</h1>
      <p className="mt-1 text-muted">Обновите информацию о задаче</p>
      <EditJobForm job={job} categories={categories} />
    </div>
  );
}
