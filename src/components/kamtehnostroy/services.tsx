"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { services, servicesNote, servicesTitle } from "@/data/kamtehnostroy";
import { Frame, Text } from "./frame";
import { Reveal, RevealLines } from "./reveal";
import { sx } from "./sx";
import { useCanHover } from "./use-media-query";

/**
 * Услуги — крупные интерактивные строки.
 *
 * На десктопе при наведении строка сдвигается, номер укрупняется, появляется
 * стрелка и кадр, следующий за курсором. На тач-устройствах hover-а нет,
 * поэтому строка ещё и раскрывается по нажатию — состав работ доступен всем.
 *
 * Перечень — пример структуры, а не подтверждённый список услуг компании.
 */
export function Services() {
  const [hovered, setHovered] = useState<number | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const previewRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const canHover = useCanHover();

  useEffect(() => {
    const list = listRef.current;
    const preview = previewRef.current;
    if (!list || !preview || !canHover) return;

    let frame = 0;
    let x = 0;
    let y = 0;
    const apply = () => {
      frame = 0;
      preview.style.translate = `${x}px ${y}px`;
    };
    const onMove = (e: PointerEvent) => {
      x = e.clientX;
      y = e.clientY;
      if (!frame) frame = requestAnimationFrame(apply);
    };

    list.addEventListener("pointermove", onMove);
    return () => {
      list.removeEventListener("pointermove", onMove);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [canHover]);

  const active = hovered !== null ? services[hovered] : null;

  return (
    <section id="services" className="relative" aria-labelledby="services-title">
      <div className="kt-container kt-section">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between lg:gap-12">
          <RevealLines as="h2" id="services-title" lines={servicesTitle} className="kt-display-md" />
          <Reveal delay={140} className="max-w-[38ch] lg:max-w-[26ch] lg:shrink-0">
            <p className="text-sm leading-relaxed" style={{ color: "var(--kt-muted)" }}>
              <Text value={servicesNote} />
            </p>
          </Reveal>
        </div>

        <div ref={listRef} className="mt-14" onPointerLeave={() => setHovered(null)}>
          {services.map((service, i) => {
            const open = openId === service.id;
            return (
              <div
                key={service.id}
                className="kt-srv"
                onPointerEnter={() => canHover && setHovered(i)}
              >
                <button
                  type="button"
                  className="kt-srv__inner w-full text-left"
                  aria-expanded={open}
                  aria-controls={`srv-${service.id}`}
                  onClick={() => setOpenId(open ? null : service.id)}
                  onFocus={() => canHover && setHovered(i)}
                >
                  <span className="kt-srv__num kt-num">{service.number}</span>
                  <span className="kt-srv__title">{service.title}</span>
                  <span className="kt-srv__arrow" aria-hidden>
                    <ArrowUpRight size={26} strokeWidth={1.5} />
                  </span>
                </button>

                <div
                  id={`srv-${service.id}`}
                  className="kt-adv__body"
                  data-open={open ? "true" : "false"}
                  style={sx({ gridTemplateRows: open ? "1fr" : "0fr", opacity: open ? 1 : 0 })}
                >
                  <div>
                    <div className="grid grid-cols-1 gap-6 pb-8 pl-[3.25rem] pr-4 sm:grid-cols-2 lg:pl-[5.5rem]">
                      <p className="text-sm leading-relaxed" style={{ color: "var(--kt-muted)" }}>
                        <Text value={service.summary} />
                      </p>
                      <ul className="space-y-2">
                        {service.items.map((item, k) => (
                          <li key={k} className="flex items-baseline gap-3 text-sm">
                            <span
                              aria-hidden
                              className="mt-1 inline-block h-1 w-1 shrink-0 rotate-45"
                              style={{ backgroundColor: "var(--kt-accent)" }}
                            />
                            <Text value={item} />
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Кадр услуги, следующий за курсором. Только на десктопе. */}
      {canHover ? (
        <div
          ref={previewRef}
          className="kt-srv-preview"
          data-visible={active ? "true" : "false"}
          aria-hidden
        >
          {active ? (
            <Frame
              src={active.image}
              alt=""
              label="[ДОБАВИТЬ ФОТО]"
              sizes="320px"
              className="h-full w-full"
            />
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
