import * as React from "react";
import { cn } from "@/lib/utils";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          "flex min-h-[110px] w-full rounded-xl border border-border bg-card px-3.5 py-3 text-sm leading-relaxed text-foreground transition-colors",
          "placeholder:text-faint hover:border-border-strong",
          "focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/10",
          "disabled:cursor-not-allowed disabled:bg-surface disabled:opacity-60",
          className
        )}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";
