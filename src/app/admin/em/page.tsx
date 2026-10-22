"use client";

import { useEffect, useState } from "react";
import { AdminGate } from "@/components/admin/AdminGate";
import { AdminShell } from "@/components/admin/AdminShell";
import { getAdminToken } from "@/lib/api/admin-auth";
import { ApiError, apiFetch } from "@/lib/api/client";

type EmStatus = {
  enabled: boolean;
  configured: boolean;
  orderPushReady: boolean;
  autoPushOrders: boolean;
  listaPrecio: string | null;
  deposito: string | null;
  soloWeb: boolean;
  terminal: string;
  usuario: string;
  defaultCategory: string;
  defaultBrand: string;
  mediaBaseUrl: string | null;
  cursors: Array<{
    id: string;
    lastAt: string | null;
    summary: string | null;
    updatedAt: string;
  }>;
};

type SyncResult = {
  kind: string;
  created: number;
  updated: number;
  skipped: number;
  errors: string[];
  fetched: number;
  cursor: string | null;
};

type RemoteKind = "clientes" | "articulos" | "stock" | "familias" | "imagenes";

type RemoteListResponse = {
  count: number;
  limit?: number;
  offset?: number;
  items: Array<Record<string, unknown>>;
  filtros?: Record<string, unknown>;
};

const remoteTabs: Array<{ id: RemoteKind; label: string }> = [
  { id: "clientes", label: "Clientes EM" },
  { id: "articulos", label: "Artículos EM" },
  { id: "stock", label: "Stock EM" },
  { id: "familias", label: "Familias" },
  { id: "imagenes", label: "Imágenes" },
];

function remotePath(kind: RemoteKind, clientsAll: boolean) {
  if (kind === "clientes") {
    return `/em/remote/clientes?limit=200&offset=0${clientsAll ? "&all=1" : ""}`;
  }
  if (kind === "articulos") return "/em/remote/articulos?full=1&limit=200&offset=0";
  if (kind === "stock") return "/em/remote/stock?full=1&limit=200&offset=0";
  if (kind === "familias") return "/em/remote/familias";
  return "/em/remote/imagenes?full=1&limit=200&offset=0";
}

function previewRows(kind: RemoteKind, items: Array<Record<string, unknown>>) {
  return items.map((item) => {
    if (kind === "clientes") {
      return {
        id: String(item.id ?? ""),
        codigo: String(item.codigo ?? ""),
        nombre: String(item.nombre ?? ""),
        documento: String(item.documento ?? ""),
        ciudad: String(item.ciudad ?? ""),
        activo: String(item.activo ?? ""),
      };
    }
    if (kind === "articulos") {
      const familia = item.familia as { nombre?: string } | null | undefined;
      return {
        id: String(item.id ?? ""),
        codigo: String(item.codigo ?? ""),
        nombre: String(item.nombre ?? ""),
        precio: String(item.precioConImp ?? ""),
        stock: String(item.stock ?? ""),
        familia: String(familia?.nombre ?? ""),
        publicar: String(item.publicar ?? ""),
      };
    }
    if (kind === "stock") {
      return {
        articuloId: String(item.articuloId ?? ""),
        codigo: String(item.articuloCodigo ?? ""),
        nombre: String(item.articuloNombre ?? ""),
        stock: String(item.stock ?? ""),
        publicar: String(item.publicar ?? ""),
      };
    }
    if (kind === "familias") {
      return {
        id: String(item.id ?? ""),
        codigo: String(item.codigo ?? ""),
        nombre: String(item.nombre ?? ""),
        activa: String(item.activa ?? ""),
      };
    }
    return {
      articuloId: String(item.articuloId ?? ""),
      codigo: String(item.articuloCodigo ?? ""),
      nombre: String(item.articuloNombre ?? ""),
      tieneImagen: String(item.tieneImagen ?? ""),
      chars: String(item.imagenBase64Chars ?? ""),
    };
  });
}

export default function AdminEmPage() {
  const [status, setStatus] = useState<EmStatus | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<unknown>(null);
  const [remoteKind, setRemoteKind] = useState<RemoteKind>("clientes");
  const [clientsAll, setClientsAll] = useState(false);
  const [remote, setRemote] = useState<RemoteListResponse | null>(null);

  function load() {
    const token = getAdminToken();
    if (!token) return;
    apiFetch<EmStatus>("/em/status", { token })
      .then(setStatus)
      .catch(() => setStatus(null));
  }

  useEffect(() => {
    load();
  }, []);

  async function run(action: string, path: string, body?: object) {
    const token = getAdminToken();
    if (!token) return;
    setBusy(action);
    setMessage(null);
    setLastResult(null);
    try {
      const result = await apiFetch<unknown>(path, {
        method: "POST",
        token,
        body: body ? JSON.stringify(body) : undefined,
      });
      setLastResult(result);
      setMessage(`${action}: ok`);
      load();
    } catch (error) {
      const text = error instanceof ApiError ? error.message : "Error";
      setMessage(`${action}: ${text}`);
    } finally {
      setBusy(null);
    }
  }

  async function loadRemote(kind: RemoteKind = remoteKind) {
    const token = getAdminToken();
    if (!token) return;
    setBusy(`Ver ${kind}`);
    setMessage(null);
    try {
      const result = await apiFetch<RemoteListResponse>(remotePath(kind, clientsAll), { token });
      setRemote(result);
      setLastResult(result);
      setMessage(`Remoto ${kind}: ${result.count} registros (mostrando ${result.items.length})`);
    } catch (error) {
      const text = error instanceof ApiError ? error.message : "Error";
      setMessage(`Remoto ${kind}: ${text}`);
      setRemote(null);
    } finally {
      setBusy(null);
    }
  }

  const rows = remote ? previewRows(remoteKind, remote.items) : [];
  const columns = rows[0] ? Object.keys(rows[0]) : [];

  return (
    <AdminGate>
      <AdminShell title="Easy Management">
        {!status ? (
          <p className="text-cream/50">Cargando…</p>
        ) : (
          <div className="space-y-8">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: "Integración", value: status.enabled ? "Activa" : "Apagada" },
                { label: "Configurada", value: status.configured ? "Sí" : "Faltan variables" },
                { label: "Envío pedidos", value: status.orderPushReady ? "Listo" : "Falta tipo doc" },
                { label: "Auto push", value: status.autoPushOrders ? "Sí" : "No" },
              ].map((card) => (
                <div key={card.label} className="border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-wider text-cream/50">{card.label}</p>
                  <p className="mt-2 font-serif text-2xl text-gold">{card.value}</p>
                </div>
              ))}
            </div>

            <div className="border border-white/10 bg-white/5 p-4 text-sm text-cream/70">
              <p>
                Lista de precio: <span className="text-cream">{status.listaPrecio || "—"}</span>
              </p>
              <p>
                Depósito: <span className="text-cream">{status.deposito || "default"}</span>
              </p>
              <p>
                Solo web: <span className="text-cream">{status.soloWeb ? "sí" : "no"}</span> · Terminal{" "}
                <span className="text-cream">{status.terminal}</span> · Usuario{" "}
                <span className="text-cream">{status.usuario}</span>
              </p>
              <p className="mt-2 text-cream/50">
                Configurá `EM_*` en el `.env` del API (Railway). El front nunca habla con HYC.
              </p>
            </div>

            <div>
              <h2 className="mb-3 font-serif text-2xl">Ver datos en Easy Management</h2>
              <p className="mb-3 text-sm text-cream/50">
                Esto consulta HYC en vivo (no escribe en Postgres). El sync de abajo es lo que publica en la tienda.
              </p>
              <div className="mb-3 flex flex-wrap gap-2">
                {remoteTabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    disabled={Boolean(busy)}
                    onClick={() => setRemoteKind(tab.id)}
                    className={
                      remoteKind === tab.id
                        ? "bg-gold px-3 py-2 text-sm text-black"
                        : "border border-white/20 px-3 py-2 text-sm hover:bg-white/5 disabled:opacity-50"
                    }
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              {remoteKind === "clientes" ? (
                <label className="mb-3 flex items-center gap-2 text-sm text-cream/70">
                  <input
                    type="checkbox"
                    checked={clientsAll}
                    onChange={(e) => setClientsAll(e.target.checked)}
                  />
                  Incluir inactivos (`/listar/all`)
                </label>
              ) : null}
              <button
                type="button"
                disabled={Boolean(busy)}
                onClick={() => loadRemote(remoteKind)}
                className="border border-white/20 px-3 py-2 text-sm hover:bg-white/5 disabled:opacity-50"
              >
                Cargar {remoteTabs.find((t) => t.id === remoteKind)?.label}
              </button>

              {remote ? (
                <div className="mt-4 overflow-x-auto border border-white/10">
                  <p className="border-b border-white/10 px-3 py-2 text-xs text-cream/50">
                    Total EM: {remote.count} · mostrando {remote.items.length}
                    {remote.limit != null ? ` (limit ${remote.limit}, offset ${remote.offset ?? 0})` : ""}
                  </p>
                  {rows.length === 0 ? (
                    <p className="p-4 text-sm text-cream/50">Sin filas.</p>
                  ) : (
                    <table className="min-w-full text-left text-xs text-cream/80">
                      <thead className="bg-white/5 text-cream/50">
                        <tr>
                          {columns.map((col) => (
                            <th key={col} className="px-3 py-2 font-medium uppercase tracking-wider">
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/10">
                        {rows.map((row, index) => (
                          <tr key={index}>
                            {columns.map((col) => (
                              <td key={col} className="max-w-[16rem] truncate px-3 py-2">
                                {row[col]}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={Boolean(busy)}
                onClick={() => run("Ping", "/em/ping")}
                className="border border-white/20 px-3 py-2 text-sm hover:bg-white/5 disabled:opacity-50"
              >
                Probar conexión
              </button>
              <button
                type="button"
                disabled={Boolean(busy)}
                onClick={() => run("Productos", "/em/sync/products", { full: true })}
                className="border border-white/20 px-3 py-2 text-sm hover:bg-white/5 disabled:opacity-50"
              >
                Sync productos (full)
              </button>
              <button
                type="button"
                disabled={Boolean(busy)}
                onClick={() => run("Stock", "/em/sync/stock")}
                className="border border-white/20 px-3 py-2 text-sm hover:bg-white/5 disabled:opacity-50"
              >
                Sync stock
              </button>
              <button
                type="button"
                disabled={Boolean(busy)}
                onClick={() => run("Imágenes", "/em/sync/images")}
                className="border border-white/20 px-3 py-2 text-sm hover:bg-white/5 disabled:opacity-50"
              >
                Sync imágenes
              </button>
              <button
                type="button"
                disabled={Boolean(busy)}
                onClick={() => run("Clientes", "/em/sync/clients")}
                className="border border-white/20 px-3 py-2 text-sm hover:bg-white/5 disabled:opacity-50"
              >
                Vincular clientes
              </button>
              <button
                type="button"
                disabled={Boolean(busy)}
                onClick={() => run("Todo", "/em/sync/all", { full: true })}
                className="bg-gold px-3 py-2 text-sm text-black disabled:opacity-50"
              >
                Sync completo
              </button>
            </div>

            {busy ? <p className="text-sm text-cream/50">Ejecutando: {busy}…</p> : null}
            {message ? <p className="text-sm text-gold">{message}</p> : null}

            <div>
              <h2 className="mb-3 font-serif text-2xl">Cursores</h2>
              {!status.cursors.some((c) => c.id === "products") ? (
                <p className="mb-3 border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-100">
                  Todavía no hay sync de productos. Tocá <strong>Sync productos (full)</strong> — vincular clientes no
                  publica el catálogo en la tienda.
                </p>
              ) : null}
              {status.cursors.length > 0 ? (
                <div className="divide-y divide-white/10 border border-white/10">
                  {status.cursors.map((cursor) => {
                    let summary: SyncResult | null = null;
                    if (cursor.summary) {
                      try {
                        summary = JSON.parse(cursor.summary) as SyncResult;
                      } catch {
                        summary = null;
                      }
                    }
                    return (
                      <div key={cursor.id} className="p-4 text-sm">
                        <p className="font-medium text-cream">{cursor.id}</p>
                        <p className="text-cream/50">
                          Último: {cursor.lastAt ? new Date(cursor.lastAt).toLocaleString("es-UY") : "—"}
                        </p>
                        {summary ? (
                          <p className="text-cream/60">
                            fetched {summary.fetched} · +{summary.created} · ~{summary.updated} · skip{" "}
                            {summary.skipped}
                            {summary.errors?.length ? ` · errores ${summary.errors.length}` : ""}
                          </p>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-cream/50">Sin sincronizaciones todavía.</p>
              )}
            </div>

            {lastResult ? (
              <pre className="overflow-x-auto border border-white/10 bg-black/40 p-4 text-xs text-cream/70">
                {JSON.stringify(lastResult, null, 2)}
              </pre>
            ) : null}
          </div>
        )}
      </AdminShell>
    </AdminGate>
  );
}
