import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { ChatWindow } from "./chat-window";

export default async function ConversationPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ prefill?: string }>;
}) {
  const { id } = await params;
  const { prefill } = await searchParams;
  const session = await auth();
  if (!session) redirect(`/login?callbackUrl=/messages/${id}`);

  const conversation = await prisma.conversation.findUnique({ where: { id } });
  if (!conversation) notFound();
  if (conversation.customerId !== session.user.id && conversation.executorId !== session.user.id) {
    redirect("/messages");
  }

  return <ChatWindow conversationId={id} prefill={prefill} />;
}
