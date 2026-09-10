import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Восстановление пароля",
  description: "Восстановление доступа к аккаунту СтройХаба по email.",
  robots: { index: false, follow: false },
};

export default function ForgotPasswordLayout({ children }: { children: React.ReactNode }) {
  return children;
}
