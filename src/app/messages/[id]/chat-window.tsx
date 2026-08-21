"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Send } from "lucide-react";
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
    <div className="flex h-full flex-col">
      {other && (
        <div className="flex items-center gap-3 border-b border-border p-4">
          <Avatar name={other.name} src={other.avatarUrl} size={36} />
          <div>
            <div className="text-sm font-semibold text-foreground">{other.name}</div>
            {conversation?.job && (
              <Link href={`/jobs/${conversation.job.id}`} className="text-xs text-muted hover:text-primary">
                {conversation.job.title}
              </Link>
            )}
          </div>
        </div>
      )}

      <div className="flex-1 space-y-3 overflow-y-auto p-4 scrollbar-thin">
        {messages.length === 0 && <p className="text-center text-sm text-muted">Начните переписку</p>}
        {messages.map((m) => {
          const mine = m.senderId === session?.user.id;
          return (
            <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
              <div className={cn("max-w-[75%] rounded-2xl px-4 py-2 text-sm", mine ? "bg-primary text-white" : "bg-surface text-foreground")}>
                <p className="whitespace-pre-wrap">{m.text}</p>
                <p className={cn("mt-1 text-[10px]", mine ? "text-white/60" : "text-muted")}>{formatDateTime(m.createdAt)}</p>
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
          placeholder="Напишите сообщение..."
          className="flex-1 resize-none rounded-md border border-border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        />
        <button
          onClick={send}
          disabled={sending || !text.trim()}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary text-white hover:bg-primary/90 disabled:opacity-50"
        >
          <Send size={17} />
        </button>
      </div>
    </div>
  );
}
