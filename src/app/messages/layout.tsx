import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { ConversationList } from "./conversation-list";
import { MessagesShell } from "./messages-shell";

export const metadata: Metadata = {
  title: "Сообщения",
  robots: { index: false, follow: false },
};

export default async function MessagesLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login?callbackUrl=/messages");

  return (
    <div className="container-page py-6 sm:py-8">
      <h1 className="mb-5 text-2xl font-extrabold tracking-tight text-foreground">Сообщения</h1>
      <MessagesShell list={<ConversationList />}>{children}</MessagesShell>
    </div>
  );
}
