"use client";

import { useRef, useState } from "react";
import { Paperclip, X, Loader2, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

export type UploadedFile = { url: string; filename: string; type: string };

export function FileUploader({
  value,
  onChange,
  multiple = true,
  accept,
  hint,
}: {
  value: UploadedFile[];
  onChange: (files: UploadedFile[]) => void;
  multiple?: boolean;
  accept?: string;
  hint?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    setError(null);
    setUploading(true);
    try {
      const uploaded: UploadedFile[] = [];
      for (const file of Array.from(fileList)) {
        const form = new FormData();
        form.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: form });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Не удалось загрузить файл");
        uploaded.push(data);
      }
      onChange(multiple ? [...value, ...uploaded] : uploaded);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка загрузки");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div>
      <div
        onClick={() => inputRef.current?.click()}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border bg-surface/50 px-4 py-6 text-center transition-colors hover:border-primary/50",
          uploading && "pointer-events-none opacity-60"
        )}
      >
        {uploading ? <Loader2 size={22} className="animate-spin text-primary" /> : <Upload size={22} className="text-muted" />}
        <p className="text-sm text-foreground">
          {uploading ? "Загрузка..." : "Нажмите, чтобы выбрать файлы"}
        </p>
        {hint && <p className="text-xs text-muted">{hint}</p>}
        <input
          ref={inputRef}
          type="file"
          multiple={multiple}
          accept={accept}
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>
      {error && <p className="mt-1.5 text-sm text-danger">{error}</p>}

      {value.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {value.map((f, i) => (
            <li
              key={f.url + i}
              className="flex items-center justify-between gap-2 rounded-md border border-border bg-white px-3 py-2 text-sm"
            >
              <span className="flex min-w-0 items-center gap-2">
                <Paperclip size={14} className="shrink-0 text-muted" />
                <span className="truncate">{f.filename}</span>
              </span>
              <button
                type="button"
                onClick={() => onChange(value.filter((_, idx) => idx !== i))}
                className="cursor-pointer rounded p-1 text-muted hover:bg-danger-bg hover:text-danger"
              >
                <X size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
