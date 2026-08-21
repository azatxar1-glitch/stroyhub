import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { ConversationList } from "./conversation-list";

export default async function MessagesLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login?callbackUrl=/messages");

  return (
    <div className="container-page py-8">
      <h1 className="mb-6 text-2xl font-bold text-foreground">Сообщения</h1>
      <div className="grid grid-cols-1 overflow-hidden rounded-xl border border-border bg-white md:grid-cols-[320px_1fr] md:h-[calc(100vh-220px)]">
        <div className="overflow-y-auto border-border md:border-r scrollbar-thin">
          <ConversationList />
        </div>
        <div className="min-h-[400px]">{children}</div>
      </div>
    </div>
  );
}
