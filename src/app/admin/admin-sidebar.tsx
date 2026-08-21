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
    <nav className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
      {LINKS.map((link) => {
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
