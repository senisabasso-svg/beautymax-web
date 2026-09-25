# Beautymax Distribuidora

Tienda online de Beautymax, distribuidora uruguaya de productos profesionales de peluquería y barbería. El tono es de salón: negro, dorado y crema, en español rioplatense y pesos uruguayos.

## Cómo correrla

```bash
npm install
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000).

```bash
npm run build
npm start
```

Copiá `.env.example` a `.env.local` antes de deployar.

## Estructura

```txt
src/
  app/                  páginas (App Router), sitemap, robots y api/checkout
  components/
    brand/              logo, títulos y pincelada dorada
    cart/               drawer, página de carrito y barra de envío gratis
    checkout/           formulario y confirmación
    home/               bloques de la portada
    layout/             header, footer, WhatsApp, páginas legales
    product/            card, grilla, precio, variantes, galería
    shop/               catálogo con filtros
    ui/                 botones, sheet, dialog, select (estilo shadcn)
  config/store.ts       datos editables del negocio
  data/products.ts      catálogo
  data/taxonomy.ts      categorías y marcas
  lib/catalog.ts        getProducts(), getProductBySlug() y el resto de lecturas
  store/cart-store.ts   carrito (Zustand + localStorage)
public/productos/       fotos. Hoy hay placeholders en SVG.
```

La UI no lee el array de productos directo: pasa por `src/lib/catalog.ts`. Cuando migres a Supabase o a un CMS, cambiá esas funciones y las páginas siguen igual.

## Cambiar precios

Todos los precios están en `src/data/products.ts`, dentro de cada `variant(...)`.

```ts
variant("op-shine-30", "30 ml", 690, "BM-OP-SH-30")
//                         precio en pesos, sin centavos
```

Están marcados como placeholder (`// TODO precio real` en el helper `variant`). El formato en pantalla es `$U 1.290`.

El envío también es editable, en `src/config/store.ts`:

- `freeShippingFrom`: a partir de este subtotal el envío estimado es gratis.
- `shippingCost`: costo estimado por debajo de ese monto.
- Retiro siempre es sin costo.

## Agregar un producto

1. Sumá un objeto al array `products` en `src/data/products.ts`.
2. Usá un `slug` único. La URL queda en `/producto/[slug]`.
3. `category` tiene que ser una de: `coloracion`, `decoloracion`, `tratamientos`, `styling`, `tijeras`, `maquinas`, `secadores`, `planchas`.
4. Cada presentación es una variante con `label`, `price`, `sku` y `stock`.
5. `badges` puede incluir `exclusivo`, `nuevo` o `mas-vendido`. `featured: true` lo muestra en la portada.
6. Si `stock` es 0, el botón pasa a “Sin stock”.

Para regenerar los placeholders:

```bash
npm run placeholders
```

## Fotos

Si la imagen no existe, la card muestra un fondo crema con la marca en serif. Para usar la foto real:

1. Guardala en `public/productos/` (PNG, JPG o WebP).
2. Cambiá `images` del producto, por ejemplo `["/productos/proyou-colormaker-aloe-vera.png"]`.

`next/image` optimiza PNG, JPG y WebP. Los SVG de relleno se sirven directo.

Nombres que ya están previstos en el catálogo: `proyou-colormaker-aloe-vera`, `proyou-lifter-balde`, `plasma-deco-9-tonos`, `plasma-mix-triaminico-box` y `wella-color-touch`.

## Datos del negocio

Todo lo que no es un producto vive en `src/config/store.ts`: nombre, WhatsApp, Instagram, textos de la barra superior, medios de pago y envío.

El WhatsApp de los pedidos es `whatsappE164` (`59897428888`).

## Mercado Pago

Fase 1 (la que está activa): al confirmar, el pedido se arma y se abre en WhatsApp. No hace falta token.

Fase 2, cuando quieras cobrar con Checkout Pro:

1. En `.env.local`:

```bash
NEXT_PUBLIC_ENABLE_MP=true
MP_ACCESS_TOKEN=APP_USR-...
NEXT_PUBLIC_SITE_URL=https://tu-dominio.com
```

2. Si el cliente elige Mercado Pago, `app/api/checkout/route.ts` crea la preferencia y redirige a `init_point`.
3. Con el flag en `false`, esa ruta responde 403 y el checkout sigue por WhatsApp.

El token no se usa en el navegador. Solo lo lee el route handler.

## Deploy en Vercel

1. Subí el repo a GitHub.
2. En [vercel.com/new](https://vercel.com/new), importá el proyecto. Framework: Next.js. No hace falta cambiar el comando de build.
3. Cargá las variables de `.env.example`.
4. `NEXT_PUBLIC_SITE_URL` tiene que ser la URL final (`https://…`). La usan el sitemap, Open Graph y las vueltas de Mercado Pago.

## Pedido por WhatsApp

El mensaje incluye número de pedido, ítems, variantes, cantidades, totales, datos del cliente, entrega y pago. La pantalla `/pedido-confirmado` guarda el resumen en la sesión del navegador y deja reenviar el mensaje.
