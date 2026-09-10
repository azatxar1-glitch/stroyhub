import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Регистрация",
  description:
    "Регистрация на СтройХабе: заказчикам — размещать заявки, специалистам — откликаться и получать заказы.",
  robots: { index: false, follow: true },
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
