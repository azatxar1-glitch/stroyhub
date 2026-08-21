"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { MessageSquare, AlertTriangle } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { LinkButton } from "@/components/ui/link-button";
import { cn, timeAgo } from "@/lib/utils";

type Conversation = {
  id: string;
  job: { id: string; title: string } | null;
  customer: { id: string; name: string; avatarUrl: string | null };
  executor: { id: string; name: string; avatarUrl: string | null };
  messages: { text: string; createdAt: string; senderId: string }[];
  _count: { messages: number };
};

export function ConversationList() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  async function load() {
    try {
      const res = await fetch("/api/conversations");
      if (!res.ok) {
        setFailed(true);
        return;
      }
      setConversations(await res.json());
      setFailed(false);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- state updates run after the awaited fetch
    load();
    const interval = setInterval(load, 8000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="space-y-1 p-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-3 p-2">
            <Skeleton className="h-11 w-11 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3.5 w-28" />
              <Skeleton className="h-3 w-40" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (failed) {
    return (
      <div className="flex flex-col items-center gap-3 p-8 text-center">
        <AlertTriangle size={24} className="text-danger-text" aria-hidden />
        <p className="text-sm font-semibold text-foreground">Не удалось загрузить диалоги</p>
        <button
          onClick={() => {
            setLoading(true);
            load();
          }}
          className="rounded-lg border border-border px-3.5 py-2 text-sm font-semibold text-foreground hover:bg-surface"
        >
          Повторить
        </button>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 p-10 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface">
          <MessageSquare size={22} className="text-muted" aria-hidden />
        </span>
        <p className="text-sm font-bold text-foreground">Пока нет диалогов</p>
        <p className="max-w-[15rem] text-sm text-muted">
          Переписка начинается после отклика на заявку или обращения к специалисту.
        </p>
        <LinkButton href="/executors" variant="outline" size="sm" className="mt-1">
          Найти специалиста
        </LinkButton>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-border">
      {conversations.map((c) => {
        const other = session?.user.id === c.customer.id ? c.executor : c.customer;
        const lastMessage = c.messages[0];
        const active = pathname === `/messages/${c.id}`;
        const unread = c._count.messages;

        return (
          <li key={c.id}>
            <Link
              href={`/messages/${c.id}`}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-surface",
                active && "bg-surface"
              )}
            >
              <Avatar name={other.name} src={other.avatarUrl} size={44} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className={cn("truncate text-sm text-foreground", unread > 0 ? "font-bold" : "font-semibold")}>
                    {other.name}
                  </span>
                  {lastMessage && (
                    <span className="shrink-0 text-xs text-faint">{timeAgo(lastMessage.createdAt)}</span>
                  )}
                </div>
                <p className={cn("truncate text-xs", unread > 0 ? "font-medium text-foreground" : "text-muted")}>
                  {lastMessage ? lastMessage.text : (c.job?.title ?? "Новый диалог")}
                </p>
              </div>
              {unread > 0 && (
                <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-accent px-1.5 text-[10px] font-bold text-accent-foreground">
                  {unread}
                </span>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
