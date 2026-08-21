"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

/**
 * Two-pane on desktop, one-pane on mobile: the conversation list is the screen
 * at /messages, and an open thread takes over the screen at /messages/[id].
 */
export function MessagesShell({ list, children }: { list: React.ReactNode; children: React.ReactNode }) {
  const pathname = usePathname();
  const threadOpen = pathname !== "/messages";

  return (
    <div className="grid grid-cols-1 overflow-hidden rounded-2xl border border-border bg-card md:h-[calc(100vh-13rem)] md:grid-cols-[320px_1fr]">
      <div
        className={cn(
          "overflow-y-auto border-border scrollbar-thin md:block md:border-r",
          threadOpen && "hidden"
        )}
      >
        {list}
      </div>
      <div className={cn("min-h-[60vh] md:block md:min-h-0", !threadOpen && "hidden")}>{children}</div>
    </div>
  );
}
