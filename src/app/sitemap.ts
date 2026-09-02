import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { projects as ktProjects } from "@/data/kamtehnostroy";

const siteUrl = process.env.AUTH_URL ?? "https://stroyhub.vercel.app";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: siteUrl, changeFrequency: "daily", priority: 1 },
    { url: `${siteUrl}/executors`, changeFrequency: "daily", priority: 0.9 },
    { url: `${siteUrl}/jobs`, changeFrequency: "hourly", priority: 0.9 },
    { url: `${siteUrl}/categories`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${siteUrl}/how-it-works`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${siteUrl}/register`, changeFrequency: "monthly", priority: 0.4 },
    // Корпоративный сайт ООО «КАМТЕХНОСТРОЙ» — отдельный раздел со своей оболочкой.
    { url: `${siteUrl}/kamtehnostroy`, changeFrequency: "monthly", priority: 0.9 },
    ...ktProjects.map((project) => ({
      url: `${siteUrl}/kamtehnostroy/objects/${project.id}`,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
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
      ...categories.map((c) => ({
        url: `${siteUrl}/executors?category=${c.slug}`,
        changeFrequency: "weekly" as const,
        priority: 0.6,
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
    // A database hiccup shouldn't make the sitemap 500 — serve the static core.
    return staticRoutes;
  }
}
