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
# Instalar Railway CLI (una vez)
npm i -g @railway/cli

# Login
railway login

# Desde la carpeta api
cd api
npm install

# Crear proyecto / linkear
railway init
# o: railway link

# Conectar la base Postgres al servicio API (en el dashboard:
# API service → Variables → Add Reference → DATABASE_URL del Postgres)

# Variables del API (Railway → Variables)
# DATABASE_URL=...          (referencia al Postgres)
# JWT_SECRET=un-secreto-largo-y-random
# ADMIN_EMAIL=admin@beautymax.uy
# ADMIN_PASSWORD=BeautymaxAdmin2026!
# CORS_ORIGIN=https://TU-FRONT.pages.dev
# PORT=4000
# SITE_URL=https://TU-FRONT.pages.dev

# Deploy
railway up
```

Root directory del servicio: **`api`**.

Builder: Dockerfile (ya está `api/Dockerfile`).

Al arrancar hace `prisma db push` + seed (catálogo + admin).

**Admin por defecto**
- URL front: `https://TU-FRONT/admin/login`
- Email: `admin@beautymax.uy`
- Pass: `BeautymaxAdmin2026!` (cambiala en Railway)

Health check: `https://TU-API.up.railway.app/health`

---

## 2) Front en Cloudflare

```bash
# En la raíz del repo (no en api/)
npm install

# Adaptador OpenNext para Cloudflare
npm i -D @opennextjs/cloudflare wrangler

# Login Cloudflare
npx wrangler login

# Variables (Pages / Workers → Settings → Variables)
# NEXT_PUBLIC_SITE_URL=https://tu-dominio.com
# NEXT_PUBLIC_API_URL=https://TU-API.up.railway.app

# Build + deploy
npx opennextjs-cloudflare build
npx wrangler deploy
```

Alternativa con Cloudflare Pages (UI):
1. Conectá el repo en [Cloudflare Pages](https://dash.cloudflare.com/)
2. Framework preset: Next.js
3. Build command: `npx opennextjs-cloudflare build` (o el que indique OpenNext)
4. Root: `/`
5. Env vars: `NEXT_PUBLIC_SITE_URL` y `NEXT_PUBLIC_API_URL`

---

## 3) Local (dev)

Terminal 1 — API:

```bash
cd api
cp .env.example .env
# poné DATABASE_URL de un Postgres local o de Railway
npm install
npx prisma db push
npm run db:seed
npm run dev
```

Terminal 2 — Front:

```bash
cp .env.example .env.local
# NEXT_PUBLIC_API_URL=http://localhost:4000
npm install
npm run dev
```

Admin local: [http://localhost:3000/admin/login](http://localhost:3000/admin/login)

---

## Checklist post-deploy

1. Abrí `/health` del API → `{ ok: true }`
2. Entrá a `/admin/login` y logueate
3. Revisá Productos / Pedidos / Códigos
4. En Railway, cambiá `ADMIN_PASSWORD` y `JWT_SECRET`
5. `CORS_ORIGIN` debe ser exactamente la URL del front
