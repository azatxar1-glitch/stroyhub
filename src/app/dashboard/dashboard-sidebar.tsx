"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, User, FileText, Send, ShoppingBag, Images } from "lucide-react";
import { cn } from "@/lib/utils";
import { ROLES } from "@/lib/constants";

export function DashboardSidebar({ role }: { role: string }) {
  const pathname = usePathname();

  const links = [
    { href: "/dashboard", label: "Обзор", icon: LayoutDashboard, exact: true },
    { href: "/dashboard/profile", label: "Профиль", icon: User },
    ...(role === ROLES.CUSTOMER ? [{ href: "/dashboard/jobs", label: "Мои заявки", icon: FileText }] : []),
    ...(role === ROLES.EXECUTOR
      ? [
          { href: "/dashboard/proposals", label: "Мои отклики", icon: Send },
          { href: "/dashboard/portfolio", label: "Портфолио", icon: Images },
        ]
      : []),
    { href: "/dashboard/orders", label: "Заказы", icon: ShoppingBag },
  ];

  return (
    <nav className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
      {links.map((link) => {
        const active = link.exact ? pathname === link.href : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "flex shrink-0 items-center gap-2.5 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
              active ? "bg-primary text-white" : "text-foreground hover:bg-surface"
            )}
          >
            <link.icon size={17} />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
