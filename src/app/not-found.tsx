import Link from "next/link";

export default function NotFound() {
  return (
    <section className="bg-black text-white">
      <div className="mx-auto flex min-h-[70vh] max-w-site flex-col items-start justify-center px-4 py-24 sm:px-6 lg:px-8">
        <p className="text-[11px] font-semibold uppercase tracking-section text-gold">404</p>
        <h1 className="mt-3 font-serif text-5xl md:text-7xl">Esta página no está en el salón.</h1>
        <div className="gold-line mt-6 h-px w-16" />
        <p className="mt-5 max-w-md text-sm text-white/70">El enlace no existe o el producto cambió de lugar. Volvé a la tienda y seguí desde ahí.</p>
        <Link href="/tienda" className="mt-8 inline-flex h-12 items-center rounded-btn bg-gold px-6 text-[12px] font-semibold uppercase tracking-ui text-black">
          Ir a la tienda
        </Link>
      </div>
    </section>
  );
}
