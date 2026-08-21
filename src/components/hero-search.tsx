"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin, Wifi } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The primary entry point of the whole product: one query, an optional city,
 * and a remote toggle — all funnelled into the existing /executors filters.
 */
export function HeroSearch({ cities }: { cities: string[] }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [city, setCity] = useState("");
  const [remote, setRemote] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (city) params.set("city", city);
    if (remote) params.set("remote", "true");
    router.push(`/executors${params.toString() ? `?${params}` : ""}`);
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-2xl border border-white/10 bg-white p-2.5 shadow-[0_24px_60px_-24px_rgb(0_0_0/0.6)]"
    >
      <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center">
        <div className="flex flex-1 items-center gap-3 rounded-xl px-3.5 py-1 lg:py-0">
          <Search size={20} className="shrink-0 text-muted" aria-hidden />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Подготовить КС-2, сделать смету, найти ПТО…"
            aria-label="Что нужно сделать?"
            className="h-12 w-full min-w-0 bg-transparent text-[15px] text-foreground placeholder:text-faint focus:outline-none"
          />
        </div>

        <div className="hidden w-px self-stretch bg-border lg:block" />

        <div className="flex items-center gap-2.5">
          <div className="relative flex-1 lg:w-44 lg:flex-none">
            <MapPin
              size={17}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
              aria-hidden
            />
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              aria-label="Город"
              className="h-12 w-full appearance-none rounded-xl border border-border bg-card pl-9 pr-8 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/10 lg:border-transparent"
            >
              <option value="">Любой город</option>
              {cities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => setRemote((v) => !v)}
            aria-pressed={remote}
            className={cn(
              "flex h-12 shrink-0 items-center gap-2 rounded-xl border px-4 text-sm font-semibold transition-colors",
              remote
                ? "border-accent bg-accent-soft text-accent-text"
                : "border-border bg-card text-muted hover:border-border-strong hover:text-foreground"
            )}
          >
            <Wifi size={16} aria-hidden />
            Удалённо
          </button>
        </div>

        <button
          type="submit"
          className="h-12 shrink-0 rounded-xl bg-accent px-7 text-sm font-bold text-accent-foreground transition-colors hover:bg-accent-hover active:scale-[0.98]"
        >
          Найти специалиста
        </button>
      </div>
    </form>
  );
}
