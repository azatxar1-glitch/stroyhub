"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  User,
  FileText,
  Send,
  ShoppingBag,
  Images,
  Star,
  MessageSquare,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ROLES } from "@/lib/constants";

export function DashboardSidebar({ role }: { role: string }) {
  const pathname = usePathname();
  const isExecutor = role === ROLES.EXECUTOR;

  const links = [
    { href: "/dashboard", label: "Обзор", icon: LayoutDashboard, exact: true },
    ...(role === ROLES.CUSTOMER
      ? [
          { href: "/dashboard/jobs", label: "Мои заявки", icon: FileText },
          { href: "/executors", label: "Найти специалиста", icon: Search },
        ]
      : []),
    ...(isExecutor
      ? [
          { href: "/jobs", label: "Новые заявки", icon: Search },
          { href: "/dashboard/proposals", label: "Мои отклики", icon: Send },
          { href: "/dashboard/portfolio", label: "Портфолио", icon: Images },
        ]
      : []),
    { href: "/dashboard/orders", label: "Заказы", icon: ShoppingBag },
    { href: "/dashboard/reviews", label: "Отзывы", icon: Star },
    { href: "/messages", label: "Сообщения", icon: MessageSquare },
    { href: "/dashboard/profile", label: "Профиль", icon: User },
  ];

  return (
    <nav
      aria-label="Разделы кабинета"
      className="no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0"
    >
      {links.map((link) => {
        const active = link.exact ? pathname === link.href : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex shrink-0 items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors",
              active
                ? "bg-primary text-white"
                : "text-muted hover:bg-surface hover:text-foreground"
            )}
          >
            <link.icon size={17} aria-hidden />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
