# Deploy Beautymax

## Base de datos en Railway

Creá **PostgreSQL** (no MySQL ni Redis).

En el dashboard de Railway:
1. New Project → **Add PostgreSQL**
2. Copiá `DATABASE_URL` (Variables del servicio Postgres)
3. Ese valor va al servicio del **API**

---

## 1) Backend en Railway (`api/`)

```bash
npm i -g @railway/cli
railway login
cd api
npm install
railway init
railway add --database postgres
railway up
```

Root Directory del servicio: **`api`**  
Builder: **Dockerfile**  
Watch Paths: `/api/**`

Variables:
```
DATABASE_URL=${{Postgres.DATABASE_URL}}
JWT_SECRET=un-secreto-largo
ADMIN_EMAIL=admin@beautymax.uy
ADMIN_PASSWORD=BeautymaxAdmin2026!
CORS_ORIGIN=https://TU-SITIO.pages.dev
PORT=4000
```

Health: `https://TU-API.up.railway.app/health`

---

## 2) Front en Cloudflare Pages (clásico)

Export estático (`out/`). En [Cloudflare Pages](https://dash.cloudflare.com/) → Create → Connect GitHub → `beautymax-web`.

| Campo | Valor |
|---|---|
| **Framework preset** | Next.js (Static HTML Export) o None |
| **Root directory** | `/` (vacío) |
| **Build command** | `npm run build` |
| **Build output directory** | `out` |
| **Node version** | `22` (o 20) |

### Variables de entorno (Pages → Settings → Environment variables)

| Nombre | Valor |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://TU-PROYECTO.pages.dev` |
| `NEXT_PUBLIC_API_URL` | `https://TU-API.up.railway.app` |
| `NEXT_PUBLIC_ENABLE_MP` | `false` |

Después del primer deploy, actualizá `CORS_ORIGIN` en Railway con la URL `.pages.dev`.

### Deploy local de prueba

```bash
npm install
npm run build
npx serve out
```

---

## 3) Local (dev)

Terminal 1 — API:

```bash
cd api
cp .env.example .env
npm install
npx prisma db push
npm run db:seed
npm run dev
```

Terminal 2 — Front:

```bash
cp .env.example .env.local
npm install
npm run dev
```

Admin: http://localhost:3000/admin/login  
Email: `admin@beautymax.uy` / Pass: `BeautymaxAdmin2026!`
