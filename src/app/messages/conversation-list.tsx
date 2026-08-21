"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Avatar } from "@/components/ui/avatar";
import { cn, timeAgo } from "@/lib/utils";
import { MessageSquare } from "lucide-react";

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

  async function load() {
    try {
      const res = await fetch("/api/conversations");
      if (!res.ok) return;
      setConversations(await res.json());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 8000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="space-y-2 p-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-lg bg-surface" />
        ))}
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 p-8 text-center text-sm text-muted">
        <MessageSquare size={24} />
        Пока нет диалогов
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      {conversations.map((c) => {
        const other = session?.user.id === c.customer.id ? c.executor : c.customer;
        const lastMessage = c.messages[0];
        const active = pathname === `/messages/${c.id}`;
        return (
          <Link
            key={c.id}
            href={`/messages/${c.id}`}
            className={cn("flex items-center gap-3 p-3 hover:bg-surface", active && "bg-surface")}
          >
            <Avatar name={other.name} src={other.avatarUrl} size={44} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-sm font-medium text-foreground">{other.name}</span>
                {lastMessage && <span className="shrink-0 text-xs text-muted">{timeAgo(lastMessage.createdAt)}</span>}
              </div>
              <p className="truncate text-xs text-muted">{lastMessage ? lastMessage.text : c.job?.title ?? "Новый диалог"}</p>
            </div>
            {c._count.messages > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-[10px] font-semibold text-white">
                {c._count.messages}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
