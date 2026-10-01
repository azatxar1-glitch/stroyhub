"use client";

import { useRef, useState } from "react";
import { Paperclip, X, Loader2, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { uploadFile, type UploadedFile } from "@/lib/upload-client";
import { MAX_UPLOAD_SIZE, formatSize } from "@/lib/uploads";

export type { UploadedFile };

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
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    setError(null);
    setUploading(true);
    try {
      const uploaded: UploadedFile[] = [];
      for (const file of Array.from(fileList)) {
        // Процент нужен не для красоты: проектная документация занимает
        // десятки мегабайт, и без него непонятно, идёт ли дело вообще.
        setProgress(null);
        uploaded.push(await uploadFile(file, (percentage) => setProgress(Math.round(percentage))));
      }
      onChange(multiple ? [...value, ...uploaded] : uploaded);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка загрузки");
    } finally {
      setUploading(false);
      setProgress(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={cn(
          "flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border-strong bg-surface/60 px-4 py-8 text-center transition-colors hover:border-accent hover:bg-accent-soft",
          uploading && "pointer-events-none opacity-60"
        )}
      >
        {uploading ? (
          <Loader2 size={24} className="animate-spin text-accent" aria-hidden />
        ) : (
          <Upload size={24} className="text-muted" aria-hidden />
        )}
        <span className="text-sm font-semibold text-foreground">
          {uploading
            ? progress === null
              ? "Загрузка…"
              : `Загрузка… ${progress}%`
            : "Нажмите, чтобы выбрать файлы"}
        </span>
        <span className="text-xs text-muted">{hint ?? `До ${formatSize(MAX_UPLOAD_SIZE)} на файл`}</span>
        <input
          ref={inputRef}
          type="file"
          multiple={multiple}
          accept={accept}
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </button>
      {error && (
        <p role="alert" className="mt-2 text-sm font-medium text-danger-text">
          {error}
        </p>
      )}

      {value.length > 0 && (
        <ul className="mt-3 space-y-2">
          {value.map((f, i) => (
            <li
              key={f.url + i}
              className="flex items-center justify-between gap-2 rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm"
            >
              <span className="flex min-w-0 items-center gap-2">
                <Paperclip size={14} className="shrink-0 text-muted" aria-hidden />
                <span className="truncate font-medium text-foreground">{f.filename}</span>
              </span>
              <button
                type="button"
                onClick={() => onChange(value.filter((_, idx) => idx !== i))}
                aria-label={`Удалить файл ${f.filename}`}
                className="cursor-pointer rounded-lg p-1.5 text-muted transition-colors hover:bg-danger-bg hover:text-danger-text"
              >
                <X size={15} aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
