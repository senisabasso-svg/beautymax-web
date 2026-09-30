import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Montserrat } from "next/font/google";
import type { ReactNode } from "react";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { VisitTracker } from "@/components/analytics/VisitTracker";
import { CatalogHydrator } from "@/components/catalog/CatalogHydrator";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { StoreChrome } from "@/components/layout/StoreChrome";
import { TopBar } from "@/components/layout/TopBar";
import { WhatsAppButton } from "@/components/layout/WhatsAppButton";
import { DiscountWheel } from "@/components/promo/DiscountWheel";
import { PwaInstallPrompt } from "@/components/pwa/PwaInstallPrompt";
import { PwaRegister } from "@/components/pwa/PwaRegister";
import { JsonLd } from "@/components/seo/JsonLd";
import { Toaster } from "@/components/ui/sonner";
import { storeConfig } from "@/config/store";
import "./globals.css";

const serif = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-serif",
  display: "swap",
});

const sans = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(storeConfig.siteUrl),
  title: {
    default: `${storeConfig.name} · ${storeConfig.tagline}`,
    template: `%s · ${storeConfig.shortName}`,
  },
  description: storeConfig.description,
  applicationName: storeConfig.shortName,
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: storeConfig.shortName,
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    type: "website",
    locale: "es_UY",
    siteName: storeConfig.name,
    title: storeConfig.name,
    description: storeConfig.description,
  },
};

export const viewport: Viewport = {
  themeColor: "#0E0E0E",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" className={`${serif.variable} ${sans.variable}`}>
      <body className="min-h-screen bg-cream font-sans text-ink antialiased">
        <a
          href="#contenido"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[80] focus:bg-gold focus:px-4 focus:py-2 focus:text-black"
        >
          Saltar al contenido
        </a>
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "Organization",
            name: storeConfig.name,
            slogan: storeConfig.tagline,
            url: storeConfig.siteUrl,
            telephone: `+${storeConfig.whatsappE164}`,
            areaServed: "UY",
            sameAs: [storeConfig.instagramUrl],
          }}
        />
        <CatalogHydrator />
        <VisitTracker />
        <PwaRegister />
        <StoreChrome>
          <TopBar />
          <Header />
        </StoreChrome>
        <main id="contenido">{children}</main>
        <StoreChrome>
          <Footer />
          <CartDrawer />
          <DiscountWheel />
          <WhatsAppButton />
          <PwaInstallPrompt />
        </StoreChrome>
        <Toaster />
      </body>
    </html>
  );
}
