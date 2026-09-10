import type { MetadataRoute } from "next";
import { siteUrl, isProduction } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  // Превью-деплой закрываем целиком — он не должен попадать в выдачу.
  if (!isProduction) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  return {
    rules: {
      userAgent: "*",
      // Явно перечисляем открытые разделы: так видно намерение, и правило
      // Disallow: /jobs/new не может по ошибке утащить за собой ленту /jobs.
      allow: ["/", "/executors", "/jobs", "/categories", "/how-it-works", "/privacy", "/terms", "/contacts"],
      // Личные кабинеты и формы: поисковой ценности нет, часть — с личными данными.
      disallow: [
        "/dashboard",
        "/admin",
        "/messages",
        "/api/",
        "/jobs/new",
        "/login",
        "/register",
        "/forgot-password",
        "/reset-password",
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
