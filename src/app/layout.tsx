import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { MobileTabBar } from "@/components/mobile-tabbar";
import { siteUrl, isProduction } from "@/lib/site";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

const description =
  "СтройХаб — специализированный маркетплейс строительной отрасли. Найдите ПТО, сметчика, проектировщика, прораба, технадзор или бригаду: рейтинг, отзывы, портфолио и отклики с ценой и сроком.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "СтройХаб — специалисты и услуги строительной отрасли",
    template: "%s · СтройХаб",
  },
  description,
  keywords: [
    "строительный маркетплейс",
    "ПТО",
    "сметчик",
    "исполнительная документация",
    "АОСР",
    "КС-2",
    "КС-3",
    "проектировщик",
    "технадзор",
    "прораб",
    "строительные бригады",
  ],
  applicationName: "СтройХаб",
  authors: [{ name: "СтройХаб" }],
  openGraph: {
    type: "website",
    locale: "ru_RU",
    // "./" — относительно текущего пути, поэтому og:url у каждой страницы свой.
    url: "./",
    siteName: "СтройХаб",
    // title и description не задаём намеренно: заданные здесь, они
    // наследуются всеми страницами, и в мессенджерах каталог, лента и
    // категории выглядят одной ссылкой. Без них подставляются заголовок
    // и описание конкретной страницы.
  },
  twitter: {
    card: "summary_large_image",
  },
  // Иконки и картинку превью Next собирает сам из файлов рядом с layout:
  // icon.svg, apple-icon.png, opengraph-image.png. Указывать их здесь нельзя:
  // страница, объявившая свой openGraph, заместила бы родительский вместе с
  // картинкой — по этой же причине в страницах openGraph больше нет вовсе.
  // Манифест лежит в public, под файловое соглашение не попадает, поэтому
  // указан явно.
  manifest: "/site.webmanifest",
  alternates: { canonical: "./" },
  // Превью-деплои не должны индексироваться: иначе в выдаче появятся дубли
  // основного сайта, конкурирующие с ним за те же запросы.
  robots: isProduction
    ? { index: true, follow: true }
    : { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#111827",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ru" className={`${inter.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <Providers>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-accent focus:px-4 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-[#111827]"
          >
            Перейти к содержимому
          </a>
          <Navbar />
          <main id="main" className="flex-1 pb-safe-tabbar">
            {children}
          </main>
          <Footer />
          <MobileTabBar />
        </Providers>
      </body>
    </html>
  );
}
