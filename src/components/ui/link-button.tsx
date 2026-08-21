import Link, { type LinkProps } from "next/link";
import type { VariantProps } from "class-variance-authority";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type LinkButtonProps = LinkProps &
  VariantProps<typeof buttonVariants> & {
    className?: string;
    children: React.ReactNode;
    onClick?: () => void;
    "aria-label"?: string;
  };

export function LinkButton({ className, variant, size, ...props }: LinkButtonProps) {
  return <Link className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}
