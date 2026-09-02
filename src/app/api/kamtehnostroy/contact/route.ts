import { NextResponse } from "next/server";
import {
  deliverInquiry,
  validateInquiry,
  type Inquiry,
} from "@/lib/kamtehnostroy/inquiry";

/**
 * Приём заявки с сайта ООО «КАМТЕХНОСТРОЙ».
 *
 * Роут уже валидирует данные и вызывает единственную точку доставки
 * (`deliverInquiry`). Канал доставки — почта, Telegram, CRM — подключается
 * там же, менять форму и этот роут не потребуется.
 */
export async function POST(request: Request) {
  let payload: Partial<Inquiry>;

  try {
    payload = (await request.json()) as Partial<Inquiry>;
  } catch {
    return NextResponse.json({ ok: false, error: "Некорректный запрос" }, { status: 400 });
  }

  const errors = validateInquiry(payload);
  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ ok: false, errors }, { status: 422 });
  }

  const inquiry: Inquiry = {
    name: (payload.name ?? "").trim(),
    companyName: (payload.companyName ?? "").trim() || undefined,
    phone: (payload.phone ?? "").trim(),
    email: (payload.email ?? "").trim(),
    message: (payload.message ?? "").trim(),
  };

  const result = await deliverInquiry(inquiry);

  return NextResponse.json({ ok: true, delivered: result.delivered, channel: result.channel });
}
