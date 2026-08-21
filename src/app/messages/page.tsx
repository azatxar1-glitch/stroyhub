import { MessageSquare } from "lucide-react";

export default function MessagesIndexPage() {
  return (
    <div className="hidden h-full flex-col items-center justify-center gap-3 p-10 text-center md:flex">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface">
        <MessageSquare size={24} className="text-muted" aria-hidden />
      </span>
      <p className="text-base font-bold text-foreground">Выберите диалог</p>
      <p className="max-w-xs text-sm text-muted">
        Здесь появится переписка с заказчиком или исполнителем по конкретной задаче.
      </p>
    </div>
  );
}
