import Link from "next/link";
import { HardHat } from "lucide-react";
import { CATEGORIES } from "@/lib/constants";

export function Footer() {
  const topCategories = CATEGORIES.slice(0, 6);

  return (
    <footer className="border-t border-border bg-primary text-white">
      <div className="container-page grid grid-cols-1 gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2 font-bold">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-white/10">
              <HardHat size={18} />
            </span>
            <span className="text-lg">СтройХаб</span>
          </div>
          <p className="mt-3 text-sm text-white/70">
            Маркетплейс, где заказчики находят проверенных специалистов для строительных задач.
          </p>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold text-white/90">Категории</h4>
          <ul className="space-y-2 text-sm text-white/70">
            {topCategories.map((c) => (
              <li key={c.slug}>
                <Link href={`/executors?category=${c.slug}`} className="hover:text-white">
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold text-white/90">Заказчикам</h4>
          <ul className="space-y-2 text-sm text-white/70">
            <li>
              <Link href="/jobs/new" className="hover:text-white">
                Разместить заявку
              </Link>
            </li>
            <li>
              <Link href="/executors" className="hover:text-white">
                Найти исполнителя
              </Link>
            </li>
            <li>
              <Link href="/register" className="hover:text-white">
                Регистрация
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold text-white/90">Исполнителям</h4>
          <ul className="space-y-2 text-sm text-white/70">
            <li>
              <Link href="/jobs" className="hover:text-white">
                Лента заявок
              </Link>
            </li>
            <li>
              <Link href="/register" className="hover:text-white">
                Создать профиль
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs text-white/50">
        © {new Date().getFullYear()} СтройХаб. Демонстрационный MVP-проект.
      </div>
    </footer>
  );
}
