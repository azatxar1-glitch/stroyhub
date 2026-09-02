import type { Metadata } from "next";
import "./kt.css";
import { company } from "@/data/kamtehnostroy";
import { Footer } from "@/components/kamtehnostroy/footer";
import { Header } from "@/components/kamtehnostroy/header";

/**
 * Оболочка корпоративного сайта ООО «КАМТЕХНОСТРОЙ».
 *
 * Класс `.kt` объявляет собственные токены (kt.css), поэтому раздел
 * не наследует оформление маркетплейса и не влияет на него.
 * Все тексты и SEO-поля берутся из `data/kamtehnostroy/company.ts`.
 */
export const metadata: Metadata = {
  title: {
    absolute: company.seo.title,
    template: `%s · ${company.shortName}`,
  },
  description: company.seo.description,
  keywords: [...company.seo.keywords],
  applicationName: company.shortName,
  openGraph: {
    type: "website",
    locale: "ru_RU",
    siteName: company.legalName,
    title: company.seo.title,
    description: company.seo.description,
    url: "/kamtehnostroy",
  },
  twitter: {
    card: "summary_large_image",
    title: company.seo.title,
    description: company.seo.description,
  },
  alternates: { canonical: "/kamtehnostroy" },
  robots: { index: true, follow: true },
};

export default function KamtehnostroyLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="kt">
      <Header />
      {children}
      <Footer />
    </div>
  );
}
