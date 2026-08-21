"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CategoryIcon } from "@/components/category-icon";

type CategoryData = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  _count: { jobs: number; executorProfiles: number };
};

export function CategoriesManager({ categories }: { categories: CategoryData[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function add() {
    setError(null);
    if (name.trim().length < 2) {
      setError("Введите название категории");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Не удалось создать категорию");
        return;
      }
      setName("");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Удалить категорию?")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
      const body = await res.json();
      if (!res.ok) {
        alert(body.error ?? "Не удалось удалить категорию");
        return;
      }
      router.refresh();
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap gap-2">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Новая категория" className="max-w-xs" />
        <Button onClick={add} disabled={loading} className="gap-1.5">
          <Plus size={15} /> Добавить
        </Button>
      </div>
      {error && <p className="mb-4 text-sm text-danger">{error}</p>}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((c) => (
          <div key={c.id} className="flex items-center justify-between gap-2 rounded-lg border border-border bg-white p-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <CategoryIcon name={c.icon} size={16} />
              </span>
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-foreground">{c.name}</div>
                <div className="text-xs text-muted">
                  {c._count.jobs} заявок · {c._count.executorProfiles} исполнителей
                </div>
              </div>
            </div>
            <button
              onClick={() => remove(c.id)}
              disabled={deletingId === c.id}
              className="shrink-0 rounded-md p-1.5 text-muted hover:bg-danger-bg hover:text-danger"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
