import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

/**
 * KlientFlo logo: the gradient "wave" mark (reads on light and dark) plus the
 * wordmark rendered as themed text, so it adapts to the active theme without
 * swapping assets. Pass `markOnly` for the icon alone.
 */
export function BrandLogo({
  className,
  markOnly = false,
  size = "md",
}: {
  className?: string;
  markOnly?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const mark = { sm: 24, md: 30, lg: 40 }[size];
  const text = { sm: "text-base", md: "text-lg", lg: "text-2xl" }[size];

  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/klientflo-mark.png"
        alt={markOnly ? `${APP_NAME} logo` : ""}
        width={mark}
        height={mark}
        className="shrink-0"
        style={{ width: mark, height: mark }}
      />
      {!markOnly && (
        <span className={cn("font-display font-extrabold text-foreground", text)}>
          {APP_NAME}
        </span>
      )}
    </span>
  );
}
