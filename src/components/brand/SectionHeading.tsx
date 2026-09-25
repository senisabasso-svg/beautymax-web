import { cn } from "@/lib/utils";

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  tone = "dark",
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "center" | "left";
  tone?: "dark" | "light";
  className?: string;
}) {
  const light = tone === "light";

  return (
    <div className={cn(align === "center" && "mx-auto text-center", "max-w-2xl", className)}>
      {eyebrow ? (
        <p className={cn("text-[11px] font-semibold uppercase tracking-section", light ? "text-gold" : "text-ink")}>
          {eyebrow}
        </p>
      ) : null}
      <h2
        className={cn(
          "mt-3 font-serif text-4xl font-semibold leading-tight md:text-5xl",
          light ? "text-white" : "text-ink",
        )}
      >
        {title}
      </h2>
      <div
        className={cn(
          "gold-line mt-5 h-px w-16",
          align === "center" && "mx-auto",
        )}
      />
      {description ? (
        <p className={cn("mt-4 text-sm leading-relaxed md:text-base", light ? "text-white/75" : "text-muted")}>
          {description}
        </p>
      ) : null}
    </div>
  );
}
