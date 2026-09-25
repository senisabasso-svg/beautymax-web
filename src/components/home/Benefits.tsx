import { BadgePercent, MessagesSquare, ShieldCheck, Truck } from "lucide-react";
import { Container } from "@/components/ui/container";

const items = [
  { icon: BadgePercent, title: "Cuotas sin interés", text: "Pagá con tarjeta y distribuí el pedido del salón." },
  { icon: Truck, title: "Envíos a todo el país", text: "DAC o agencia, desde Montevideo al interior." },
  { icon: ShieldCheck, title: "Marcas originales", text: "Organic Pro, Wella, Revlon, Kiepe y más." },
  { icon: MessagesSquare, title: "Asesoramiento profesional", text: "Te ayudamos a elegir según la técnica del salón." },
];

export function Benefits() {
  return (
    <section className="border-b border-ink/10 bg-cream">
      <Container className="grid grid-cols-2 gap-8 py-10 md:grid-cols-4 md:py-12">
        {items.map((item) => (
          <div key={item.title} className="flex flex-col gap-3">
            <item.icon className="h-5 w-5 text-gold-deep" strokeWidth={1.25} />
            <p className="font-sans text-[12px] font-semibold uppercase tracking-ui text-ink">{item.title}</p>
            <p className="text-sm leading-relaxed text-muted">{item.text}</p>
          </div>
        ))}
      </Container>
    </section>
  );
}
