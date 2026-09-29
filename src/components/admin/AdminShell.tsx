"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { clearAdminToken } from "@/lib/api/admin-auth";
import { cn } from "@/lib/utils";

const links = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/productos", label: "Productos" },
  { href: "/admin/categorias", label: "Categorías" },
  { href: "/admin/pedidos", label: "Pedidos" },
  { href: "/admin/reportes", label: "Reportes" },
  { href: "/admin/clientes", label: "Clientes" },
  { href: "/admin/descuentos-ruleta", label: "Descuentos ruleta" },
  { href: "/admin/codigos", label: "Códigos" },
];

export function AdminShell({ children, title }: { children: ReactNode; title: string }) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#111] text-cream">
      <div
        className={cn(
          "mx-auto flex min-h-screen flex-col gap-8 px-4 py-8 md:flex-row md:px-6",
          pathname.startsWith("/admin/reportes") ? "max-w-7xl" : "max-w-6xl",
        )}
      >
        <aside className="md:w-52 md:shrink-0">
          <p className="font-serif text-2xl text-gold">Beautymax</p>
          <p className="mt-1 text-xs uppercase tracking-[0.2em] text-cream/50">Admin</p>
          <nav className="mt-8 flex flex-row gap-2 overflow-x-auto md:flex-col">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-sm px-3 py-2 text-sm transition",
                  pathname === link.href || (link.href !== "/admin" && pathname.startsWith(link.href))
                    ? "bg-gold text-black"
                    : "text-cream/70 hover:bg-white/5 hover:text-cream",
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <button
            type="button"
            className="mt-6 text-sm text-cream/50 underline-offset-4 hover:text-cream hover:underline"
            onClick={() => {
              clearAdminToken();
              router.replace("/admin/login");
            }}
          >
            Cerrar sesión
          </button>
        </aside>
        <div className="flex-1">
          <h1 className="font-serif text-3xl text-cream md:text-4xl">{title}</h1>
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
