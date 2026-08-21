"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Send, ArrowLeft } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { cn, formatDateTime } from "@/lib/utils";

type Message = {
  id: string;
  text: string;
  createdAt: string;
  senderId: string;
  sender: { id: string; name: string; avatarUrl: string | null };
};

type ConversationInfo = {
  id: string;
  job: { id: string; title: string } | null;
  customer: { id: string; name: string; avatarUrl: string | null };
  executor: { id: string; name: string; avatarUrl: string | null };
};

export function ChatWindow({ conversationId, prefill }: { conversationId: string; prefill?: string }) {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversation, setConversation] = useState<ConversationInfo | null>(null);
  const [text, setText] = useState(prefill ?? "");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  async function load(showLoading = false) {
    if (showLoading) setLoading(true);
    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`);
      if (!res.ok) return;
      const data = await res.json();
      setMessages(data.messages);
      setConversation(data.conversation);
    } finally {
      if (showLoading) setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resets the loading skeleton when switching conversations
    load(true);
    const interval = setInterval(() => load(false), 4000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function send() {
    const value = text.trim();
    if (!value) return;
    setSending(true);
    setText("");
    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: value }),
      });
      if (res.ok) {
        const message = await res.json();
        setMessages((prev) => [...prev, message]);
      }
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-full flex-col justify-end gap-3 p-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-10 w-2/3 animate-pulse rounded-lg bg-surface" />
        ))}
      </div>
    );
  }

  const other = session?.user.id === conversation?.customer?.id ? conversation?.executor : conversation?.customer;

  return (
    <div className="flex h-full min-h-[60vh] flex-col md:min-h-0">
      {other && (
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <Link
            href="/messages"
            aria-label="К списку диалогов"
            className="-ml-1.5 rounded-lg p-1.5 text-muted transition-colors hover:bg-surface hover:text-foreground md:hidden"
          >
            <ArrowLeft size={20} aria-hidden />
          </Link>
          <Avatar name={other.name} src={other.avatarUrl} size={38} />
          <div className="min-w-0">
            <div className="truncate text-sm font-bold text-foreground">{other.name}</div>
            {conversation?.job && (
              <Link
                href={`/jobs/${conversation.job.id}`}
                className="block truncate text-xs text-muted transition-colors hover:text-accent-text"
              >
                {conversation.job.title}
              </Link>
            )}
          </div>
        </div>
      )}

      <div className="flex-1 space-y-2.5 overflow-y-auto p-4 scrollbar-thin">
        {messages.length === 0 && (
          <p className="py-10 text-center text-sm text-muted">
            Начните переписку — обсудите детали задачи, сроки и стоимость.
          </p>
        )}
        {messages.map((m) => {
          const mine = m.senderId === session?.user.id;
          return (
            <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[78%] px-4 py-2.5 text-sm",
                  mine
                    ? "rounded-2xl rounded-br-md bg-accent text-accent-foreground"
                    : "rounded-2xl rounded-bl-md bg-surface text-foreground"
                )}
              >
                <p className="whitespace-pre-wrap leading-relaxed">{m.text}</p>
                <p className={cn("mt-1 text-[10px]", mine ? "text-white/70" : "text-faint")}>
                  {formatDateTime(m.createdAt)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="flex items-end gap-2 border-t border-border p-3">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          rows={1}
          aria-label="Текст сообщения"
          placeholder="Напишите сообщение…"
          className="max-h-32 flex-1 resize-none rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm text-foreground placeholder:text-faint focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/10"
        />
        <button
          onClick={send}
          disabled={sending || !text.trim()}
          aria-label="Отправить сообщение"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground transition-colors hover:bg-accent-hover disabled:opacity-40"
        >
          <Send size={17} aria-hidden />
        </button>
      </div>
    </div>
  );
}
