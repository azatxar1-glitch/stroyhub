"use client";

import { useId, useRef, useState } from "react";
import { MapPin, X } from "lucide-react";
import { searchCities } from "@/lib/cities";
import { cn } from "@/lib/utils";

/**
 * Поле города с подсказками.
 *
 * Вместо длинного select — ввод с поиском по справочнику: сотня пунктов в
 * выпадающем списке нечитаема, а набрать три буквы быстрее, чем прокрутить.
 * Поле остаётся обычным input с именем, поэтому форма по-прежнему
 * отправляется как GET и работает без JavaScript.
 */
export function CityInput({
  name = "city",
  defaultValue = "",
  placeholder = "Любой город",
  className,
}: {
  name?: string;
  defaultValue?: string;
  placeholder?: string;
  className?: string;
}) {
  const [value, setValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const listId = useId();
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const suggestions = open ? searchCities(value) : [];

  function choose(city: string) {
    setValue(city);
    setOpen(false);
  }

  return (
    <div className={cn("relative", className)}>
      <MapPin
        size={16}
        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
        aria-hidden
      />

      <input
        name={name}
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setOpen(true);
          setHighlighted(0);
        }}
        onFocus={() => setOpen(true)}
        // Клик по подсказке приходит после blur — даём ему успеть сработать.
        onBlur={() => {
          blurTimer.current = setTimeout(() => setOpen(false), 120);
        }}
        onKeyDown={(e) => {
          if (!open || suggestions.length === 0) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setHighlighted((h) => (h + 1) % suggestions.length);
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setHighlighted((h) => (h - 1 + suggestions.length) % suggestions.length);
          } else if (e.key === "Enter" && suggestions[highlighted]) {
            e.preventDefault();
            choose(suggestions[highlighted]);
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
        placeholder={placeholder}
        aria-label="Город"
        role="combobox"
        aria-expanded={open && suggestions.length > 0}
        aria-controls={listId}
        aria-autocomplete="list"
        autoComplete="off"
        className="h-11 w-full rounded-xl border border-border bg-card pl-10 pr-9 text-sm text-foreground transition-colors placeholder:text-faint hover:border-border-strong focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/10"
      />

      {value && (
        <button
          type="button"
          onClick={() => {
            setValue("");
            setOpen(false);
          }}
          aria-label="Очистить город"
          className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-muted transition-colors hover:bg-surface hover:text-foreground"
        >
          <X size={14} aria-hidden />
        </button>
      )}

      {open && suggestions.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-30 mt-1.5 max-h-64 w-full overflow-y-auto rounded-xl border border-border bg-card py-1 shadow-[0_16px_40px_-16px_rgb(17_24_39/0.3)] scrollbar-thin"
        >
          {suggestions.map((city, i) => (
            <li key={city}>
              <button
                type="button"
                role="option"
                aria-selected={i === highlighted}
                onMouseEnter={() => setHighlighted(i)}
                onMouseDown={() => {
                  if (blurTimer.current) clearTimeout(blurTimer.current);
                }}
                onClick={() => choose(city)}
                className={cn(
                  "block w-full px-4 py-2.5 text-left text-sm text-foreground transition-colors",
                  i === highlighted ? "bg-surface" : "hover:bg-surface"
                )}
              >
                {city}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
