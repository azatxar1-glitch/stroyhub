"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, FileText, Tags, Flag } from "lucide-react";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/admin", label: "Обзор", icon: LayoutDashboard, exact: true },
  { href: "/admin/users", label: "Пользователи", icon: Users },
  { href: "/admin/jobs", label: "Заявки", icon: FileText },
  { href: "/admin/categories", label: "Категории", icon: Tags },
  { href: "/admin/complaints", label: "Жалобы", icon: Flag },
];

export function AdminSidebar() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Разделы админ-панели"
      className="no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0"
    >
      {LINKS.map((link) => {
        const active = link.exact ? pathname === link.href : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex shrink-0 items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors",
              active ? "bg-primary text-white" : "text-muted hover:bg-surface hover:text-foreground"
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
