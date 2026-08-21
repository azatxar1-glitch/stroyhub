import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl font-semibold transition-[background-color,border-color,color,box-shadow,transform] duration-150 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed",
  {
    variants: {
      variant: {
        /* The single primary action on a screen. */
        default: "bg-accent text-accent-foreground shadow-sm hover:bg-accent-hover",
        accent: "bg-accent text-accent-foreground shadow-sm hover:bg-accent-hover",
        /* Strong but not the main CTA — dark ink. */
        dark: "bg-primary text-primary-foreground hover:bg-[#1f2937]",
        outline: "border border-border bg-card text-foreground hover:bg-surface hover:border-border-strong",
        /* For use on dark backgrounds. */
        onDark: "border border-white/25 bg-white/5 text-white hover:bg-white/15",
        ghost: "text-foreground hover:bg-surface",
        success: "bg-success text-white hover:bg-[#15803d]",
        danger: "bg-danger text-white hover:bg-[#b91c1c]",
        link: "text-accent-text underline-offset-4 hover:underline p-0 h-auto",
      },
      size: {
        default: "h-11 px-5 text-sm",
        sm: "h-9 rounded-lg px-3.5 text-sm",
        lg: "h-13 px-7 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return <button className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}

export { buttonVariants };
