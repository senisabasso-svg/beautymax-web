import { Benefits } from "@/components/home/Benefits";
import { BrandsRow } from "@/components/home/BrandsRow";
import { CategoryGrid } from "@/components/home/CategoryGrid";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { Hero } from "@/components/home/Hero";
import { KiepeEditorial } from "@/components/home/KiepeEditorial";
import { OrganicEditorial } from "@/components/home/OrganicEditorial";
import { ProfessionalCta } from "@/components/home/ProfessionalCta";
import { storeConfig } from "@/config/store";

export default function HomePage() {
  return (
    <>
      <Hero />
      <Benefits />
      <CategoryGrid />
      <FeaturedProducts />
      <OrganicEditorial />
      <KiepeEditorial />
      <BrandsRow />
      <ProfessionalCta />
      <p className="sr-only">{storeConfig.tagline}</p>
    </>
  );
}
