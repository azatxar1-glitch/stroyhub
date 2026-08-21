"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { RatingInput } from "@/components/ui/rating";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export function ReviewForm({ orderId, targetName }: { orderId: string; targetName: string }) {
  const router = useRouter();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, rating, comment }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Не удалось отправить отзыв");
        return;
      }
      setDone(true);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="flex items-center gap-2 rounded-md bg-success-bg px-4 py-3 text-sm text-success">
        <CheckCircle2 size={18} /> Спасибо за отзыв!
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted">Оцените работу с {targetName}</p>
      <RatingInput value={rating} onChange={setRating} />
      <Textarea rows={3} placeholder="Комментарий (необязательно)" value={comment} onChange={(e) => setComment(e.target.value)} />
      {error && <p className="text-sm text-danger">{error}</p>}
      <Button onClick={submit} disabled={loading}>
        {loading ? "Отправка..." : "Оставить отзыв"}
      </Button>
    </div>
  );
}
