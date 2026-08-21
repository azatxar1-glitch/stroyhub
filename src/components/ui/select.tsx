import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <div className="relative">
        <select
          ref={ref}
          className={cn(
            "flex h-11 w-full appearance-none rounded-xl border border-border bg-card px-3.5 pr-10 text-sm text-foreground transition-colors",
            "hover:border-border-strong focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/10",
            "disabled:cursor-not-allowed disabled:bg-surface disabled:opacity-60",
            className
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown
          aria-hidden
          className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
        />
      </div>
    );
  }
);
Select.displayName = "Select";
