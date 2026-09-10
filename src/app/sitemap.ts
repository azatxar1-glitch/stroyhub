import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { siteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: siteUrl, changeFrequency: "daily", priority: 1 },
    { url: `${siteUrl}/executors`, changeFrequency: "daily", priority: 0.9 },
    { url: `${siteUrl}/jobs`, changeFrequency: "hourly", priority: 0.9 },
    { url: `${siteUrl}/categories`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${siteUrl}/how-it-works`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${siteUrl}/privacy`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${siteUrl}/terms`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${siteUrl}/contacts`, changeFrequency: "yearly", priority: 0.3 },
  ];

  try {
    const [categories, executors, jobs] = await Promise.all([
      prisma.category.findMany({ select: { slug: true } }),
      prisma.executorProfile.findMany({ select: { id: true, updatedAt: true }, take: 1000 }),
      prisma.job.findMany({
        where: { status: "OPEN" },
        select: { id: true, updatedAt: true },
        take: 1000,
      }),
    ]);

    return [
      ...staticRoutes,
      // Посадочные страницы направлений: собственный адрес вместо
      // query-параметра, поэтому поисковики их индексируют.
      ...categories.map((c) => ({
        url: `${siteUrl}/categories/${c.slug}`,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      })),
      ...executors.map((e) => ({
        url: `${siteUrl}/executors/${e.id}`,
        lastModified: e.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      })),
      ...jobs.map((j) => ({
        url: `${siteUrl}/jobs/${j.id}`,
        lastModified: j.updatedAt,
        changeFrequency: "daily" as const,
        priority: 0.6,
      })),
    ];
  } catch {
    // Сбой базы не должен ронять карту сайта — отдаём статическое ядро.
    return staticRoutes;
  }
}
