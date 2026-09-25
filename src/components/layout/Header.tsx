"use client";

import Link from "next/link";
import { Menu, Search, ShoppingBag } from "lucide-react";
import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Logo } from "@/components/brand/Logo";
import { SearchDialog } from "@/components/layout/SearchDialog";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { navLinks } from "@/config/store";
import { useCart, useCartCount } from "@/store/cart-store";

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const openCart = useCart((state) => state.open);
  const count = useCartCount();
  const reduce = useReducedMotion();
  const shown = ready ? count : 0;

  useEffect(() => setReady(true), []);

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-black text-white">
      <div className="mx-auto flex h-16 max-w-site items-center gap-3 px-4 sm:px-6 md:h-[72px] lg:px-8">
        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center lg:hidden"
          aria-label="Abrir menú"
          onClick={() => setMenuOpen(true)}
        >
          <Menu className="h-5 w-5" strokeWidth={1.25} />
        </button>
        <Logo className="mr-auto lg:mr-0" />
        <nav className="mx-auto hidden items-center gap-7 lg:flex" aria-label="Principal">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-[12px] font-medium uppercase tracking-[0.16em] text-white/80 transition-colors hover:text-gold"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center lg:ml-0">
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center text-white hover:text-gold"
            aria-label="Buscar productos"
            onClick={() => setSearchOpen(true)}
          >
            <Search className="h-5 w-5" strokeWidth={1.25} />
          </button>
          <button
            type="button"
            className="relative inline-flex h-11 w-11 items-center justify-center text-white hover:text-gold"
            aria-label={shown === 0 ? "Abrir carrito" : `Abrir carrito, ${shown} ${shown === 1 ? "producto" : "productos"}`}
            onClick={openCart}
          >
            <ShoppingBag className="h-5 w-5" strokeWidth={1.25} />
            {ready && shown > 0 ? (
              <motion.span
                key={shown}
                initial={reduce ? false : { scale: 0.6 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 520, damping: 18 }}
                className="absolute right-1 top-1 inline-flex h-4 min-w-4 items-center justify-center bg-gold px-1 text-[10px] font-semibold text-black"
              >
                {shown}
              </motion.span>
            ) : null}
          </button>
        </div>
      </div>
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="left" title="Menú" className="bg-black text-white">
          <div className="flex h-full flex-col px-6 pb-8 pt-16">
            <Logo />
            <nav className="mt-10 flex flex-col gap-4" aria-label="Móvil">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="font-serif text-4xl text-white hover:text-gold"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <Link
              href="/tienda"
              onClick={() => setMenuOpen(false)}
              className="mt-auto inline-flex h-12 items-center justify-center rounded-btn bg-gold text-[12px] font-semibold uppercase tracking-ui text-black"
            >
              Comprar ahora
            </Link>
          </div>
        </SheetContent>
      </Sheet>
      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </header>
  );
}
