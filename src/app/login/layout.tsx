import type { Metadata } from "next";

/**
 * Страница входа — клиентский компонент, а `metadata` экспортируется
 * только из серверных. Поэтому заголовок задаётся здесь.
 */
export const metadata: Metadata = {
  title: "Вход",
  description: "Вход в аккаунт СтройХаба — заказчикам и исполнителям.",
  robots: { index: false, follow: true },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
