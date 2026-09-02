"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { advantages, advantagesTitle } from "@/data/kamtehnostroy";
import { Text } from "./frame";
import { Reveal, RevealLines } from "./reveal";
import { useCanHover } from "./use-media-query";

/**
 * Преимущества. Не карточки «качество / цена / сроки», а три крупных пункта,
 * которые раскрываются при наведении на десктопе и по нажатию на телефоне.
 */
export function Advantages() {
  const [open, setOpen] = useState<number | null>(0);
  const canHover = useCanHover();

  return (
    <section id="advantages" aria-labelledby="advantages-title">
      <div className="kt-container kt-section">
        <RevealLines
          as="h2"
          id="advantages-title"
          lines={advantagesTitle}
          className="kt-display kt-display--fit"
        />

        <div className="mt-14 border-t lg:mt-20" style={{ borderColor: "var(--kt-line)" }}>
          {advantages.map((item, i) => {
            const isOpen = open === i;
            return (
              <Reveal
                key={item.number}
                delay={i * 90}
                className="border-b"
              >
                <div
                  data-open={isOpen ? "true" : "false"}
                  className="kt-adv"
                  onPointerEnter={() => canHover && setOpen(i)}
                >
                  <button
                    type="button"
                    className="flex w-full items-start gap-5 py-7 text-left lg:gap-10 lg:py-10"
                    aria-expanded={isOpen}
                    aria-controls={`adv-${item.number}`}
                    onClick={() => setOpen(isOpen ? null : i)}
                    onFocus={() => setOpen(i)}
                  >
                    <span
                      className="kt-num mt-1 text-xs font-semibold tracking-[0.16em]"
                      style={{ color: isOpen ? "var(--kt-accent-text)" : "var(--kt-faint)" }}
                    >
                      {item.number}
                    </span>
                    {/* Собственный clamp, а не kt-display-sm: здесь целое
                        предложение, и на узком экране оно должно быть мельче. */}
                    <span className="flex-1 pr-2 text-[clamp(1.0625rem,4.4vw,2rem)] font-semibold leading-snug tracking-tight sm:pr-4">
                      {item.title}
                    </span>
                    <span
                      aria-hidden
                      className="mt-2 shrink-0 transition-transform duration-500"
                      style={{ color: "var(--kt-faint)" }}
                    >
                      {isOpen ? <Minus size={22} strokeWidth={1.5} /> : <Plus size={22} strokeWidth={1.5} />}
                    </span>
                  </button>

                  <div id={`adv-${item.number}`} className="kt-adv__body">
                    <div>
                      <p className="kt-lead max-w-[62ch] pb-8 pl-10 lg:pb-12 lg:pl-[5.5rem]">
                        <Text value={item.text} />
                      </p>
                    </div>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
