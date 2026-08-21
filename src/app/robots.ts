import type { MetadataRoute } from "next";

const siteUrl = process.env.AUTH_URL ?? "https://stroyhub.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Private and transactional areas carry no SEO value and may expose user data.
      disallow: ["/dashboard", "/admin", "/messages", "/api/", "/jobs/new"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
