import Link from "next/link";
import { BrushUnderline } from "@/components/brand/BrushUnderline";
import { Container } from "@/components/ui/container";
import { advisorMessage, whatsappUrl } from "@/lib/whatsapp";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-black text-white">
      <svg
        className="pointer-events-none absolute -right-10 top-8 h-[120%] w-[70%] opacity-80"
        viewBox="0 0 600 700"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="heroBrush" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#9A7B2F" />
            <stop offset="50%" stopColor="#E8D29A" />
            <stop offset="100%" stopColor="#C9A24A" />
          </linearGradient>
        </defs>
        <path
          d="M40 520c80 40 120-120 210-90 100 30 90 140 190 80 70-40 90-150 140-90"
          fill="none"
          stroke="url(#heroBrush)"
          strokeWidth="28"
          strokeLinecap="round"
        />
        <path
          d="M70 250c90-20 140 80 230 40 80-30 120-90 210-40"
          fill="none"
          stroke="url(#heroBrush)"
          strokeWidth="10"
          strokeLinecap="round"
          opacity="0.7"
        />
      </svg>
      <Container className="relative flex min-h-[calc(100svh-6.75rem)] flex-col justify-end py-16 md:justify-center md:py-24">
        <p className="animate-fadeUp text-[11px] font-semibold uppercase tracking-section text-gold">Distribuidora · Uruguay</p>
        <h1 className="animate-fadeUp mt-4 max-w-4xl font-serif text-[clamp(2.7rem,7vw,5.6rem)] font-semibold leading-[1.02] [animation-delay:80ms]">
          Más de 40 años
          <span className="mt-1 block">
            con{" "}
            <span className="relative inline-block">
              exclusividad
              <BrushUnderline className="absolute -bottom-1 left-0" />
            </span>{" "}
            total
          </span>
          <span className="mt-1 block italic font-medium">al profesional</span>
        </h1>
        <p className="animate-fadeUp mt-8 max-w-xl text-sm leading-relaxed text-white/75 md:text-base [animation-delay:140ms]">
          Productos de peluquería y barbería para salones de todo el país. Asesoramiento de cabina, cuotas sin interés y marcas originales, con Organic Pro en exclusiva.
        </p>
        <div className="animate-fadeUp mt-8 flex flex-col gap-3 sm:flex-row [animation-delay:200ms]">
          <Link
            href="/tienda"
            className="inline-flex h-12 items-center justify-center rounded-btn bg-gold px-6 text-[12px] font-semibold uppercase tracking-ui text-black hover:bg-gold-deep"
          >
            Comprar ahora
          </Link>
          <a
            href={whatsappUrl(advisorMessage())}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-12 items-center justify-center rounded-btn border border-gold px-6 text-[12px] font-semibold uppercase tracking-ui text-gold hover:bg-gold hover:text-black"
          >
            Hablar con un asesor
          </a>
        </div>
      </Container>
    </section>
  );
}
