"use client";

import { useId, useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { validateInquiry, type Inquiry, type InquiryErrors } from "@/lib/kamtehnostroy/inquiry";

type Status = "idle" | "sending" | "sent" | "error";

const EMPTY: Inquiry = { name: "", companyName: "", phone: "", email: "", message: "" };

const FIELDS = [
  { name: "name", label: "Имя", type: "text", autoComplete: "name", required: true },
  { name: "companyName", label: "Компания", type: "text", autoComplete: "organization", required: false },
  { name: "phone", label: "Телефон", type: "tel", autoComplete: "tel", required: true },
  { name: "email", label: "E-mail", type: "email", autoComplete: "email", required: true },
] as const;

/**
 * Форма заявки. Проверка выполняется на клиенте теми же правилами, что и
 * на сервере (`lib/kamtehnostroy/inquiry.ts`), поэтому подключение почты,
 * Telegram или CRM не потребует правок в этом компоненте.
 */
export function ContactForm() {
  const uid = useId();
  const [values, setValues] = useState<Inquiry>(EMPTY);
  const [errors, setErrors] = useState<InquiryErrors>({});
  const [status, setStatus] = useState<Status>("idle");

  const set = (key: keyof Inquiry, value: string) => {
    setValues((v) => ({ ...v, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const found = validateInquiry(values);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      // Фокус на первом поле с ошибкой — иначе ошибку легко не заметить.
      const first = Object.keys(found)[0];
      document.getElementById(`${uid}-${first}`)?.focus();
      return;
    }

    setStatus("sending");
    try {
      const response = await fetch("/api/kamtehnostroy/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!response.ok) throw new Error("request failed");
      setStatus("sent");
      setValues(EMPTY);
    } catch {
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div
        className="flex min-h-[22rem] flex-col items-start justify-center border p-8 lg:p-10"
        style={{ borderColor: "var(--kt-line-dark)" }}
      >
        <span
          className="flex h-11 w-11 items-center justify-center rounded-full"
          style={{ backgroundColor: "var(--kt-accent-on-dark)", color: "var(--kt-ink)" }}
        >
          <Check size={20} aria-hidden />
        </span>
        <h3 className="mt-6 text-2xl font-semibold tracking-tight">Заявка отправлена</h3>
        <p className="mt-3 max-w-[40ch] text-sm leading-relaxed" style={{ color: "var(--kt-on-dark-muted)" }}>
          Спасибо. Мы свяжемся с вами, чтобы обсудить задачу.
        </p>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="kt-btn kt-btn--outline-dark mt-8"
        >
          Отправить ещё одну
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-7">
      <div className="grid grid-cols-1 gap-7 sm:grid-cols-2">
        {FIELDS.map((field) => (
          <div key={field.name}>
            <label className="kt-field-label" htmlFor={`${uid}-${field.name}`}>
              {field.label}
              {field.required ? <span aria-hidden> *</span> : null}
            </label>
            <input
              id={`${uid}-${field.name}`}
              name={field.name}
              type={field.type}
              autoComplete={field.autoComplete}
              className="kt-field mt-1"
              value={values[field.name] ?? ""}
              onChange={(e) => set(field.name, e.target.value)}
              aria-invalid={errors[field.name] ? true : undefined}
              aria-describedby={errors[field.name] ? `${uid}-${field.name}-error` : undefined}
              required={field.required}
            />
            {errors[field.name] ? (
              <p id={`${uid}-${field.name}-error`} className="mt-2 text-xs" style={{ color: "#e59182" }}>
                {errors[field.name]}
              </p>
            ) : null}
          </div>
        ))}
      </div>

      <div>
        <label className="kt-field-label" htmlFor={`${uid}-message`}>
          Описание проекта <span aria-hidden>*</span>
        </label>
        <textarea
          id={`${uid}-message`}
          name="message"
          rows={4}
          className="kt-field mt-1 resize-y"
          value={values.message}
          onChange={(e) => set("message", e.target.value)}
          aria-invalid={errors.message ? true : undefined}
          aria-describedby={errors.message ? `${uid}-message-error` : undefined}
          required
        />
        {errors.message ? (
          <p id={`${uid}-message-error`} className="mt-2 text-xs" style={{ color: "#e59182" }}>
            {errors.message}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-4 pt-2 sm:flex-row sm:items-center sm:justify-between">
        <button type="submit" className="kt-btn kt-btn--light" disabled={status === "sending"}>
          {status === "sending" ? "Отправляем…" : "Отправить заявку"}
          <ArrowRight size={16} className="kt-btn__arrow" aria-hidden />
        </button>
        <p className="max-w-[34ch] text-xs leading-relaxed" style={{ color: "var(--kt-on-dark-faint)" }}>
          Нажимая кнопку, вы соглашаетесь с обработкой персональных данных.
        </p>
      </div>

      <p aria-live="polite" className="sr-only">
        {status === "error" ? "Не удалось отправить заявку" : ""}
      </p>
      {status === "error" ? (
        <p className="text-sm" style={{ color: "#e59182" }}>
          Не удалось отправить заявку. Попробуйте ещё раз или позвоните нам.
        </p>
      ) : null}
    </form>
  );
}
