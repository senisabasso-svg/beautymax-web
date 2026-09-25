import type { BrandInfo, Category, CategoryInfo } from "@/types/product";

export const categories: CategoryInfo[] = [
  {
    slug: "coloracion",
    name: "Coloración",
    eyebrow: "Cabina",
    description:
      "Coloración profesional para salón: coberturas, tonos y mezclas listas para trabajar en cabina.",
  },
  {
    slug: "decoloracion",
    name: "Decoloración",
    eyebrow: "Aclarado",
    description:
      "Decolorantes y lifters de uso profesional, pensados para aclarados controlados y fondos limpios.",
  },
  {
    slug: "tratamientos",
    name: "Tratamientos",
    eyebrow: "Cuidado",
    description:
      "Máscaras, queratinas y cuidados de cabina para reconstruir, nutrir y sellar el cabello.",
  },
  {
    slug: "styling",
    name: "Styling",
    eyebrow: "Peinado",
    description:
      "Serums, cremas y fijadores para terminar el peinado con brillo, control y definición.",
  },
  {
    slug: "tijeras",
    name: "Tijeras",
    eyebrow: "Kiepe",
    description:
      "Tijeras Kiepe Italia de acero japonés, filo navaja y modelos para diestros y zurdos.",
  },
  {
    slug: "maquinas",
    name: "Máquinas",
    eyebrow: "Corte",
    description: "Máquinas Hepike by Kiepe para el trabajo diario de barbería y peluquería.",
  },
  {
    slug: "secadores",
    name: "Secadores",
    eyebrow: "Herramientas",
    description:
      "Secadores profesionales. Coordiná disponibilidad y asesoramiento con el equipo de Beautymax.",
  },
  {
    slug: "planchas",
    name: "Planchas",
    eyebrow: "Herramientas",
    description:
      "Planchas profesionales para salón. Escribinos y te orientamos según la técnica que trabajás.",
  },
];

export const brands: BrandInfo[] = [
  {
    slug: "organic-pro",
    name: "Organic Pro",
    description:
      "Línea exclusiva de Beautymax. Fórmulas sin sal, activos naturales y resultados visibles para salones.",
  },
  {
    slug: "pro-you",
    name: "Pro You",
    description: "Color, decoloración y styling de uso profesional para el día a día del salón.",
  },
  {
    slug: "plasma",
    name: "Plasma",
    description: "Decoloración y color triamínico pensados para el trabajo técnico en cabina.",
  },
  {
    slug: "wella-professionals",
    name: "Wella Professionals",
    description: "Coloración profesional Wella para tonos precisos y acabados de salón.",
  },
  {
    slug: "revlon-professional",
    name: "Revlon Professional",
    description: "Cuidado y tratamiento profesional Revlon para cabello trabajado.",
  },
  {
    slug: "silkey",
    name: "Silkey",
    description: "Coloración Silkey Colorkey Milenium para el trabajo de salón.",
  },
  {
    slug: "kiepe-italia",
    name: "Kiepe Italia",
    description:
      "Tijeras y máquinas Hepike by Kiepe. Acero japonés, filo navaja y opción para zurdos.",
  },
];

export function getCategory(slug: string) {
  return categories.find((category) => category.slug === slug);
}

export function isCategory(slug: string): slug is Category {
  return categories.some((category) => category.slug === slug);
}
