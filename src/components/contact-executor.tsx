"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ContactExecutorButtons({ executorUserId }: { executorUserId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState<"message" | "offer" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function openChat(prefill?: string) {
    setError(null);
    setLoading(prefill ? "offer" : "message");
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otherUserId: executorUserId }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Не удалось открыть чат");
        return;
      }
      const url = prefill ? `/messages/${body.id}?prefill=${encodeURIComponent(prefill)}` : `/messages/${body.id}`;
      router.push(url);
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-2">
      <Button className="w-full gap-2" onClick={() => openChat()} disabled={loading !== null}>
        <MessageSquare size={16} /> {loading === "message" ? "Открываем чат..." : "Написать"}
      </Button>
      <Button
        variant="outline"
        className="w-full gap-2"
        onClick={() => openChat("Здравствуйте! У меня есть задача, хочу предложить вам работу.")}
        disabled={loading !== null}
      >
        <Briefcase size={16} /> {loading === "offer" ? "Открываем чат..." : "Предложить работу"}
      </Button>
      {error && <p className="text-sm text-danger-text">{error}</p>}
    </div>
  );
}
