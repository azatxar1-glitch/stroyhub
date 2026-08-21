import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "flex h-11 w-full rounded-xl border border-border bg-card px-3.5 text-sm text-foreground transition-colors",
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
Input.displayName = "Input";
