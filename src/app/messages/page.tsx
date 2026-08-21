import { MessageSquare } from "lucide-react";

export default function MessagesIndexPage() {
  return (
    <div className="hidden h-full flex-col items-center justify-center gap-2 p-10 text-center text-muted md:flex">
      <MessageSquare size={32} />
      <p>Выберите диалог слева, чтобы начать переписку</p>
    </div>
  );
}
