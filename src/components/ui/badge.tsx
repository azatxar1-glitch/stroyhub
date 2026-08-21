import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold leading-none",
  {
    variants: {
      variant: {
        default: "bg-surface text-foreground border border-border",
        primary: "bg-surface text-foreground border border-border",
        accent: "bg-accent-soft text-accent-text border border-accent-border",
        success: "bg-success-bg text-success-text border border-success-border",
        warning: "bg-warning-bg text-warning-text border border-warning/20",
        danger: "bg-danger-bg text-danger-text border border-danger/20",
        info: "bg-info-bg text-info border border-info/20",
        dark: "bg-primary text-white",
        onDark: "bg-white/10 text-white border border-white/15",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, className }))} {...props} />;
}

export { badgeVariants };
