"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import { Menu, X, HardHat, LayoutDashboard, MessageSquare, ShieldCheck, LogOut } from "lucide-react";
import { LinkButton } from "@/components/ui/link-button";
import { Avatar } from "@/components/ui/avatar";
import { NotificationsBell } from "@/components/notifications-bell";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/executors", label: "Исполнители" },
  { href: "/jobs", label: "Заявки" },
  { href: "/#how-it-works", label: "Как это работает" },
];

export function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const user = session?.user;

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-white/95 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-primary">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-white">
            <HardHat size={20} />
          </span>
          <span className="text-lg tracking-tight">СтройХаб</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "text-sm font-medium text-foreground/80 transition-colors hover:text-primary",
                pathname === link.href && "text-primary"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {status === "loading" ? (
            <div className="h-9 w-24 animate-pulse rounded-md bg-surface" />
          ) : user ? (
            <>
              {user.role === "CUSTOMER" && (
                <LinkButton href="/jobs/new" size="sm" variant="accent">
                  Разместить заявку
                </LinkButton>
              )}
              <Link href="/messages" className="rounded-md p-2 text-foreground hover:bg-surface" aria-label="Сообщения">
                <MessageSquare size={20} />
              </Link>
              <NotificationsBell />
              <div className="relative">
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  className="flex cursor-pointer items-center gap-2 rounded-md p-1 hover:bg-surface"
                >
                  <Avatar name={user.name ?? "?"} src={user.image} size={32} />
                </button>
                {menuOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
                    <div className="absolute right-0 z-40 mt-2 w-56 rounded-lg border border-border bg-white p-1.5 shadow-lg">
                      <div className="px-3 py-2">
                        <div className="truncate text-sm font-semibold">{user.name}</div>
                        <div className="truncate text-xs text-muted">{user.email}</div>
                      </div>
                      <div className="my-1 h-px bg-border" />
                      <Link
                        href="/dashboard"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-surface"
                      >
                        <LayoutDashboard size={16} /> Личный кабинет
                      </Link>
                      {user.role === "ADMIN" && (
                        <Link
                          href="/admin"
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-surface"
                        >
                          <ShieldCheck size={16} /> Админ-панель
                        </Link>
                      )}
                      <button
                        onClick={() => signOut({ callbackUrl: "/" })}
                        className="flex w-full cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-danger hover:bg-danger-bg"
                      >
                        <LogOut size={16} /> Выйти
                      </button>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            <>
              <LinkButton href="/login" variant="ghost" size="sm">
                Войти
              </LinkButton>
              <LinkButton href="/register" size="sm">
                Регистрация
              </LinkButton>
            </>
          )}
        </div>

        <button
          className="rounded-md p-2 text-foreground md:hidden"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Меню"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-border bg-white px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-md px-3 py-2.5 text-sm font-medium hover:bg-surface"
              >
                {link.label}
              </Link>
            ))}
            {user ? (
              <>
                <Link href="/dashboard" onClick={() => setMobileOpen(false)} className="rounded-md px-3 py-2.5 text-sm font-medium hover:bg-surface">
                  Личный кабинет
                </Link>
                <Link href="/messages" onClick={() => setMobileOpen(false)} className="rounded-md px-3 py-2.5 text-sm font-medium hover:bg-surface">
                  Сообщения
                </Link>
                {user.role === "CUSTOMER" && (
                  <Link href="/jobs/new" onClick={() => setMobileOpen(false)} className="rounded-md px-3 py-2.5 text-sm font-medium hover:bg-surface">
                    Разместить заявку
                  </Link>
                )}
                {user.role === "ADMIN" && (
                  <Link href="/admin" onClick={() => setMobileOpen(false)} className="rounded-md px-3 py-2.5 text-sm font-medium hover:bg-surface">
                    Админ-панель
                  </Link>
                )}
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="mt-1 cursor-pointer rounded-md px-3 py-2.5 text-left text-sm font-medium text-danger hover:bg-danger-bg"
                >
                  Выйти
                </button>
              </>
            ) : (
              <div className="mt-2 flex gap-2">
                <LinkButton href="/login" variant="outline" className="flex-1" onClick={() => setMobileOpen(false)}>
                  Войти
                </LinkButton>
                <LinkButton href="/register" className="flex-1" onClick={() => setMobileOpen(false)}>
                  Регистрация
                </LinkButton>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
