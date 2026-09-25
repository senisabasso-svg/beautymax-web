import { Container } from "@/components/ui/container";

export function PageHero({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <section className="bg-black text-white">
      <Container className="py-14 md:py-20">
        <p className="text-[11px] font-semibold uppercase tracking-section text-gold">{eyebrow}</p>
        <h1 className="mt-3 max-w-3xl font-serif text-4xl font-semibold leading-tight md:text-6xl">{title}</h1>
        <div className="gold-line mt-5 h-px w-16" />
        {description ? <p className="mt-5 max-w-2xl text-sm leading-relaxed text-white/75 md:text-base">{description}</p> : null}
      </Container>
    </section>
  );
}
