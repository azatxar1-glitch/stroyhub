"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import {
  Menu,
  X,
  LayoutDashboard,
  MessageSquare,
  ShieldCheck,
  LogOut,
  User as UserIcon,
  Plus,
} from "lucide-react";
import { LinkButton } from "@/components/ui/link-button";
import { Avatar } from "@/components/ui/avatar";
import { NotificationsBell } from "@/components/notifications-bell";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/executors", label: "Исполнители" },
  { href: "/jobs", label: "Заявки" },
  { href: "/categories", label: "Категории" },
  { href: "/how-it-works", label: "Как это работает" },
];

export function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const user = session?.user;

  const closeMobile = () => setMobileOpen(false);
  const closeMenu = () => setMenuOpen(false);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/90 backdrop-blur-md">
      <div className="container-page flex h-16 items-center gap-4">
        <Logo />

        <nav aria-label="Основная навигация" className="ml-4 hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((link) => {
            const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
                  active ? "bg-surface text-foreground" : "text-muted hover:bg-surface hover:text-foreground"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {status === "loading" ? (
            <div className="skeleton h-9 w-32 rounded-lg" />
          ) : user ? (
            <>
              {user.role !== "EXECUTOR" && (
                <LinkButton href="/jobs/new" size="sm" className="hidden gap-1.5 sm:inline-flex">
                  <Plus size={16} aria-hidden />
                  Создать заявку
                </LinkButton>
              )}
              <Link
                href="/messages"
                className="hidden rounded-lg p-2.5 text-muted transition-colors hover:bg-surface hover:text-foreground sm:block"
                aria-label="Сообщения"
              >
                <MessageSquare size={19} aria-hidden />
              </Link>
              <NotificationsBell />

              <div className="relative hidden sm:block">
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  aria-expanded={menuOpen}
                  aria-haspopup="menu"
                  aria-label="Меню профиля"
                  className="flex cursor-pointer items-center rounded-full p-0.5 transition-shadow hover:ring-2 hover:ring-border"
                >
                  <Avatar name={user.name ?? "?"} src={user.image} size={34} />
                </button>
                {menuOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={closeMenu} aria-hidden />
                    <div
                      role="menu"
                      onClick={closeMenu}
                      className="absolute right-0 z-40 mt-2 w-60 origin-top-right animate-fade-up rounded-xl border border-border bg-card p-1.5 shadow-[0_16px_40px_-16px_rgb(17_24_39/0.3)]"
                    >
                      <div className="px-3 py-2.5">
                        <div className="truncate text-sm font-bold text-foreground">{user.name}</div>
                        <div className="truncate text-xs text-muted">{user.email}</div>
                      </div>
                      <div className="my-1 h-px bg-border" />
                      <MenuLink href="/dashboard" icon={LayoutDashboard}>
                        Личный кабинет
                      </MenuLink>
                      <MenuLink href="/dashboard/profile" icon={UserIcon}>
                        Профиль
                      </MenuLink>
                      {user.role === "ADMIN" && (
                        <MenuLink href="/admin" icon={ShieldCheck}>
                          Админ-панель
                        </MenuLink>
                      )}
                      <div className="my-1 h-px bg-border" />
                      <button
                        role="menuitem"
                        onClick={() => signOut({ callbackUrl: "/" })}
                        className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-danger-text transition-colors hover:bg-danger-bg"
                      >
                        <LogOut size={16} aria-hidden /> Выйти
                      </button>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <LinkButton href="/login" variant="ghost" size="sm">
                Войти
              </LinkButton>
              <LinkButton href="/register" variant="outline" size="sm">
                Регистрация
              </LinkButton>
              <LinkButton href="/jobs/new" size="sm" className="hidden gap-1.5 lg:inline-flex">
                <Plus size={16} aria-hidden />
                Создать заявку
              </LinkButton>
            </div>
          )}

          <button
            className="rounded-lg p-2.5 text-foreground transition-colors hover:bg-surface lg:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? "Закрыть меню" : "Открыть меню"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={21} aria-hidden /> : <Menu size={21} aria-hidden />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="fixed inset-x-0 bottom-0 top-16 z-40 overflow-y-auto border-t border-border bg-card lg:hidden">
          <nav
            className="container-page flex flex-col gap-1 py-5"
            aria-label="Мобильная навигация"
            // Any navigation from inside the panel should dismiss it.
            onClick={closeMobile}
          >
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-xl px-4 py-3.5 text-[15px] font-semibold text-foreground transition-colors hover:bg-surface"
              >
                {link.label}
              </Link>
            ))}

            <div className="my-3 h-px bg-border" />

            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className="rounded-xl px-4 py-3.5 text-[15px] font-semibold text-foreground hover:bg-surface"
                >
                  Личный кабинет
                </Link>
                <Link
                  href="/messages"
                  className="rounded-xl px-4 py-3.5 text-[15px] font-semibold text-foreground hover:bg-surface"
                >
                  Сообщения
                </Link>
                <Link
                  href="/dashboard/profile"
                  className="rounded-xl px-4 py-3.5 text-[15px] font-semibold text-foreground hover:bg-surface"
                >
                  Профиль
                </Link>
                {user.role === "ADMIN" && (
                  <Link
                    href="/admin"
                    className="rounded-xl px-4 py-3.5 text-[15px] font-semibold text-foreground hover:bg-surface"
                  >
                    Админ-панель
                  </Link>
                )}
                {user.role !== "EXECUTOR" && (
                  <LinkButton href="/jobs/new" size="lg" className="mt-3 w-full gap-2">
                    <Plus size={18} aria-hidden />
                    Создать заявку
                  </LinkButton>
                )}
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="mt-2 cursor-pointer rounded-xl px-4 py-3.5 text-left text-[15px] font-semibold text-danger-text hover:bg-danger-bg"
                >
                  Выйти
                </button>
              </>
            ) : (
              <div className="flex flex-col gap-2.5">
                <LinkButton href="/jobs/new" size="lg" className="w-full gap-2">
                  <Plus size={18} aria-hidden />
                  Создать заявку
                </LinkButton>
                <LinkButton href="/login" variant="outline" size="lg" className="w-full">
                  Войти
                </LinkButton>
                <LinkButton href="/register" variant="ghost" size="lg" className="w-full">
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

function MenuLink({
  href,
  icon: Icon,
  children,
}: {
  href: string;
  icon: React.ComponentType<{ size?: number }>;
  children: React.ReactNode;
}) {
  return (
    <Link
      role="menuitem"
      href={href}
      className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-surface"
    >
      <Icon size={16} /> {children}
    </Link>
  );
}
