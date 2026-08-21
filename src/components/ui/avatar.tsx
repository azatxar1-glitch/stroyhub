import { cn } from "@/lib/utils";
import { initials } from "@/lib/utils";

export function Avatar({
  src,
  name,
  size = 40,
  className,
}: {
  src?: string | null;
  name: string;
  size?: number;
  className?: string;
}) {
  const style = { width: size, height: size, fontSize: size * 0.38 };
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name}
        style={style}
        className={cn("rounded-full object-cover border border-border", className)}
      />
    );
  }
  return (
    <div
      style={style}
      className={cn(
        "flex items-center justify-center rounded-full bg-primary/10 font-semibold text-primary",
        className
      )}
    >
      {initials(name) || "?"}
    </div>
  );
}
