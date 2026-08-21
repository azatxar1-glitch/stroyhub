"use client";

import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import Link from "next/link";
import { cn, timeAgo } from "@/lib/utils";

type Notification = {
  id: string;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
};

export function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  async function load() {
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch {
      // ignore transient polling errors
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- setState only runs after the awaited fetch resolves
    load();
    const interval = setInterval(load, 20000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  async function markAllRead() {
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAll: true }),
    });
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => {
          setOpen((v) => !v);
          if (!open && unreadCount > 0) markAllRead();
        }}
        className="relative cursor-pointer rounded-md p-2 text-foreground hover:bg-surface"
        aria-label="Уведомления"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 z-40 mt-2 max-h-96 w-80 overflow-y-auto rounded-lg border border-border bg-white shadow-lg scrollbar-thin">
          <div className="border-b border-border p-3 text-sm font-semibold">Уведомления</div>
          {notifications.length === 0 ? (
            <div className="p-4 text-sm text-muted">Пока нет уведомлений</div>
          ) : (
            notifications.map((n) => (
              <Link
                key={n.id}
                href={n.link ?? "#"}
                onClick={() => setOpen(false)}
                className={cn(
                  "block border-b border-border px-4 py-3 text-sm last:border-0 hover:bg-surface",
                  !n.isRead && "bg-info-bg/40"
                )}
              >
                <div className="font-medium text-foreground">{n.title}</div>
                <div className="mt-0.5 line-clamp-2 text-muted">{n.message}</div>
                <div className="mt-1 text-xs text-muted">{timeAgo(n.createdAt)}</div>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}
