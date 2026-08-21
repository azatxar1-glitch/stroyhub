import * as React from "react";
import { cn } from "@/lib/utils";

export function Label({
  className,
  hint,
  children,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement> & { hint?: string }) {
  return (
    <label className={cn("mb-2 flex items-baseline gap-2 text-sm font-semibold text-foreground", className)} {...props}>
      <span>{children}</span>
      {hint && <span className="text-xs font-normal text-faint">{hint}</span>}
    </label>
  );
}
