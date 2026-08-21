"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, ImagePlus } from "lucide-react";
import type { PortfolioItem } from "@prisma/client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";

export function PortfolioManager({ items }: { items: PortfolioItem[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleUpload(file: File) {
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();
      if (res.ok) setImageUrl(data.url);
    } finally {
      setUploading(false);
    }
  }

  async function save() {
    setError(null);
    if (!title.trim() || !imageUrl) {
      setError("Добавьте изображение и название");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/executors/me/portfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, imageUrl }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Не удалось сохранить");
        return;
      }
      setOpen(false);
      setTitle("");
      setDescription("");
      setImageUrl("");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Удалить эту работу из портфолио?")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/executors/me/portfolio/${id}`, { method: "DELETE" });
      if (res.ok) router.refresh();
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      <Button onClick={() => setOpen(true)} className="mb-5 gap-2">
        <Plus size={16} /> Добавить работу
      </Button>

      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-surface/50 p-6 text-sm text-muted">
          Портфолио пока пусто. Добавьте первую работу.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {items.map((item) => (
            <div key={item.id} className="group relative overflow-hidden rounded-lg border border-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.imageUrl} alt={item.title} className="h-32 w-full object-cover" />
              <div className="p-2">
                <div className="truncate text-xs font-medium text-foreground">{item.title}</div>
              </div>
              <button
                onClick={() => remove(item.id)}
                disabled={deletingId === item.id}
                className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-danger-text opacity-0 shadow transition-opacity group-hover:opacity-100"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} title="Добавить работу">
        <div className="space-y-3">
          <div>
            <Label>Изображение</Label>
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imageUrl} alt="" className="h-32 w-full rounded-md object-cover" />
            ) : (
              <label className="flex h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border bg-surface/50 text-muted hover:border-primary/50">
                {uploading ? "Загрузка..." : <ImagePlus size={22} />}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
                />
              </label>
            )}
          </div>
          <div>
            <Label htmlFor="pf-title">Название</Label>
            <Input id="pf-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Монтаж фасада, ЖК «Северный»" />
          </div>
          <div>
            <Label htmlFor="pf-desc">Описание</Label>
            <Textarea id="pf-desc" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          {error && <p className="text-sm text-danger-text">{error}</p>}
          <Button className="w-full" onClick={save} disabled={saving}>
            {saving ? "Сохранение..." : "Добавить"}
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
