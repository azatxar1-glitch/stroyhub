import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { MobileTabBar } from "@/components/mobile-tabbar";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

const siteUrl = process.env.AUTH_URL ?? "https://stroyhub.vercel.app";
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
    url: siteUrl,
    siteName: "СтройХаб",
    title: "СтройХаб — специалисты и услуги строительной отрасли",
    description,
  },
  twitter: {
    card: "summary_large_image",
    title: "СтройХаб — специалисты и услуги строительной отрасли",
    description,
  },
  robots: {
    index: true,
    follow: true,
  },
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
