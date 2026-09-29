import Link from "next/link";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/brand/SectionHeading";
import { Reveal } from "@/components/motion/Reveal";
import { loadCategories } from "@/lib/catalog";

export async function CategoryGrid() {
  const categories = await loadCategories();

  return (
    <section className="bg-cream py-16 md:py-24">
      <Container>
        <Reveal>
          <SectionHeading eyebrow="La tienda" title="Todo lo que usa el salón" description="Color, cuidado y herramientas para peluquerías, barberías y coloristas." />
        </Reveal>
        <div className="mt-12 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          {categories.map((category) => (
            <Link
              key={category.slug}
              href={`/categoria/${category.slug}`}
              className="group relative flex min-h-48 flex-col justify-end overflow-hidden rounded-card bg-black p-4 text-white sm:min-h-64 md:min-h-72 md:p-6"
            >
              <span className="absolute right-0 top-6 h-px w-16 gold-line opacity-80 transition-all group-hover:w-24" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold">{category.eyebrow}</span>
              <span className="mt-2 font-serif text-2xl font-semibold leading-tight md:text-3xl">{category.name}</span>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}
