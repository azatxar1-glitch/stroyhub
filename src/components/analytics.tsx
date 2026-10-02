"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * Яндекс Метрика.
 *
 * Подключается, только если задан NEXT_PUBLIC_YANDEX_METRICA_ID. Переменная
 * стоит лишь в продакшене, поэтому локальная разработка счётчик не грузит и
 * статистику не портит. Сам счётчик вдобавок настроен принимать данные только
 * с боевого домена.
 *
 * Вебвизор намеренно не включаем: он пишет сессию вместе с тем, что человек
 * вводит в формы, а здесь это переписка, адреса объектов и контакты.
 */

const counterId = process.env.NEXT_PUBLIC_YANDEX_METRICA_ID;

declare global {
  interface Window {
    ym?: (id: number, action: string, ...args: unknown[]) => void;
  }
}

export function Analytics() {
  const pathname = usePathname();
  const initialHitSkipped = useRef(false);

  useEffect(() => {
    if (!counterId) return;

    // Переходы внутри приложения идут без перезагрузки страницы, и счётчик о
    // них не узнаёт — отправляем обращение сами. Первый просмотр отправляет
    // init, поэтому его пропускаем, иначе он посчитался бы дважды.
    if (!initialHitSkipped.current) {
      initialHitSkipped.current = true;
      return;
    }

    window.ym?.(Number(counterId), "hit", window.location.href);
  }, [pathname]);

  if (!counterId) return null;

  return (
    <>
      <Script
        id="yandex-metrica"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
(function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
m[i].l=1*new Date();
for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
(window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");
ym(${Number(counterId)}, "init", { clickmap: true, trackLinks: true, accurateTrackBounce: true });
          `.trim(),
        }}
      />
      <noscript>
        <div>
          {/* Обычный img намеренно: это счётчик-пиксель, а не картинка. next/image
              подменил бы адрес своим оптимизатором, и обращение до Метрики не дошло бы. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://mc.yandex.ru/watch/${counterId}`}
            style={{ position: "absolute", left: "-9999px" }}
            alt=""
          />
        </div>
      </noscript>
    </>
  );
}
