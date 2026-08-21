import Link from "next/link";
import { Compass } from "lucide-react";
import { LinkButton } from "@/components/ui/link-button";

export default function NotFound() {
  return (
    <div className="container-page flex flex-col items-center justify-center py-20 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface">
        <Compass size={28} className="text-muted" aria-hidden />
      </div>
      <p className="mt-6 text-sm font-bold uppercase tracking-wider text-accent-text">Ошибка 404</p>
      <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
        Страница не найдена
      </h1>
      <p className="mt-3 max-w-md text-muted">
        Возможно, заявка была закрыта, профиль удалён или в адресе опечатка.
      </p>

      <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
        <LinkButton href="/executors">Найти специалиста</LinkButton>
        <LinkButton href="/jobs" variant="outline">
          Лента заявок
        </LinkButton>
      </div>

      <Link href="/" className="mt-5 text-sm font-semibold text-accent-text hover:underline">
        Вернуться на главную
      </Link>
    </div>
  );
}
