"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Home, Users, FileText, MessageSquare, LayoutDashboard, LogIn } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Thumb-reachable navigation for phones. Hidden from md up, where the sticky
 * header already carries the same destinations.
 */
export function MobileTabBar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  // Chat needs the full viewport height; a fixed bar would eat the composer.
  if (pathname.startsWith("/messages/")) return null;

  const tabs = [
    { href: "/", label: "Главная", icon: Home, exact: true },
    { href: "/executors", label: "Специалисты", icon: Users },
    { href: "/jobs", label: "Заявки", icon: FileText },
    session
      ? { href: "/messages", label: "Чаты", icon: MessageSquare }
      : { href: "/login", label: "Войти", icon: LogIn },
    session
      ? { href: "/dashboard", label: "Кабинет", icon: LayoutDashboard }
      : { href: "/register", label: "Профиль", icon: LayoutDashboard },
  ];

  return (
    <nav
      aria-label="Быстрая навигация"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
    >
      <ul className="grid grid-cols-5">
        {tabs.map((tab) => {
          const active = tab.exact ? pathname === tab.href : pathname.startsWith(tab.href);
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-[3.5rem] flex-col items-center justify-center gap-1 px-1 py-2 text-[10px] font-semibold transition-colors",
                  active ? "text-accent-text" : "text-muted"
                )}
              >
                <tab.icon size={20} aria-hidden />
                <span className="truncate">{tab.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
