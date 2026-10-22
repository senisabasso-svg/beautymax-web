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
};

const remoteTabs: Array<{ id: RemoteKind; label: string }> = [
  { id: "clientes", label: "Clientes" },
  { id: "articulos", label: "Productos" },
  { id: "stock", label: "Stock" },
  { id: "familias", label: "Familias" },
  { id: "imagenes", label: "Imágenes" },
];

const cursorLabels: Record<string, string> = {
  products: "Productos",
  stock: "Stock",
  images: "Imágenes",
  clients: "Clientes",
};

function remotePath(kind: RemoteKind, clientsAll: boolean) {
  if (kind === "clientes") {
    return `/em/remote/clientes?limit=200&offset=0${clientsAll ? "&all=1" : ""}`;
  }
  if (kind === "articulos") return "/em/remote/articulos?full=1&limit=200&offset=0";
  if (kind === "stock") return "/em/remote/stock?full=1&limit=200&offset=0";
  if (kind === "familias") return "/em/remote/familias";
  return "/em/remote/imagenes?full=1&limit=200&offset=0";
}

function previewRows(kind: RemoteKind, items: Array<Record<string, unknown>>): Array<Record<string, string>> {
  return items.map((item) => {
    let row: Record<string, string>;
    if (kind === "clientes") {
      row = {
        Código: String(item.codigo ?? ""),
        Nombre: String(item.nombre ?? ""),
        Documento: String(item.documento ?? ""),
        Ciudad: String(item.ciudad ?? ""),
        Activo: item.activo === false ? "No" : "Sí",
      };
    } else if (kind === "articulos") {
      const familia = item.familia as { nombre?: string } | null | undefined;
      row = {
        Código: String(item.codigo ?? ""),
        Nombre: String(item.nombre ?? ""),
        Precio: String(item.precioConImp ?? ""),
        Stock: String(item.stock ?? ""),
        Familia: String(familia?.nombre ?? ""),
        Web: item.publicar ? "Sí" : "No",
      };
    } else if (kind === "stock") {
      row = {
        Código: String(item.articuloCodigo ?? ""),
        Nombre: String(item.articuloNombre ?? ""),
        Stock: String(item.stock ?? ""),
        Web: item.publicar ? "Sí" : "No",
      };
    } else if (kind === "familias") {
      row = {
        Código: String(item.codigo ?? ""),
        Nombre: String(item.nombre ?? ""),
        Activa: item.activa === false ? "No" : "Sí",
      };
    } else {
      row = {
        Código: String(item.articuloCodigo ?? ""),
        Nombre: String(item.articuloNombre ?? ""),
        Imagen: item.tieneImagen ? "Sí" : "No",
      };
    }
    return row;
  });
}

export default function AdminEmPage() {
  const [status, setStatus] = useState<EmStatus | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
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
    try {
      await apiFetch<unknown>(path, {
        method: "POST",
        token,
        body: body ? JSON.stringify(body) : undefined,
      });
      setMessage(`${action} listo.`);
      load();
    } catch (error) {
      const text = error instanceof ApiError ? error.message : "No se pudo completar";
      setMessage(`${action}: ${text}`);
    } finally {
      setBusy(null);
    }
  }

  async function loadRemote(kind: RemoteKind = remoteKind) {
    const token = getAdminToken();
    if (!token) return;
    setBusy(`Cargar ${kind}`);
    setMessage(null);
    try {
      const result = await apiFetch<RemoteListResponse>(remotePath(kind, clientsAll), { token });
      setRemote(result);
      setMessage(`${result.count} registros encontrados.`);
    } catch (error) {
      const text = error instanceof ApiError ? error.message : "No se pudo cargar";
      setMessage(text);
      setRemote(null);
    } finally {
      setBusy(null);
    }
  }

  const rows = remote ? previewRows(remoteKind, remote.items) : [];
  const columns = rows[0] ? Object.keys(rows[0]) : [];

  return (
    <AdminGate>
      <AdminShell title="Gestión">
        {!status ? (
          <p className="text-cream/50">Cargando…</p>
        ) : (
          <div className="space-y-8">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { label: "Conexión", value: status.enabled && status.configured ? "Activa" : "Inactiva" },
                {
                  label: "Pedidos al sistema",
                  value: status.orderPushReady ? "Listo" : "Pendiente de configurar",
                },
                { label: "Envío automático", value: status.autoPushOrders ? "Sí" : "No" },
              ].map((card) => (
                <div key={card.label} className="border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-wider text-cream/50">{card.label}</p>
                  <p className="mt-2 font-serif text-2xl text-gold">{card.value}</p>
                </div>
              ))}
            </div>

            <div>
              <h2 className="mb-2 font-serif text-2xl">Consultar sistema</h2>
              <p className="mb-3 text-sm text-cream/50">
                Mirás lo que hay en el sistema de gestión, sin cambiar la tienda todavía.
              </p>
              <div className="mb-3 flex flex-wrap gap-2">
                {remoteTabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    disabled={Boolean(busy)}
                    onClick={() => {
                      setRemoteKind(tab.id);
                      setRemote(null);
                    }}
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
                  Incluir inactivos
                </label>
              ) : null}
              <button
                type="button"
                disabled={Boolean(busy)}
                onClick={() => loadRemote(remoteKind)}
                className="border border-white/20 px-3 py-2 text-sm hover:bg-white/5 disabled:opacity-50"
              >
                Cargar {remoteTabs.find((t) => t.id === remoteKind)?.label?.toLowerCase()}
              </button>

              {remote ? (
                <div className="mt-4 overflow-x-auto border border-white/10">
                  <p className="border-b border-white/10 px-3 py-2 text-xs text-cream/50">
                    {remote.count} en total · mostrando {remote.items.length}
                  </p>
                  {rows.length === 0 ? (
                    <p className="p-4 text-sm text-cream/50">No hay resultados.</p>
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

            <div>
              <h2 className="mb-2 font-serif text-2xl">Actualizar la tienda</h2>
              <p className="mb-3 text-sm text-cream/50">
                Trae productos, stock e imágenes a la web, o vinculá clientes ya registrados.
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={Boolean(busy)}
                  onClick={() => run("Probar conexión", "/em/ping")}
                  className="border border-white/20 px-3 py-2 text-sm hover:bg-white/5 disabled:opacity-50"
                >
                  Probar conexión
                </button>
                <button
                  type="button"
                  disabled={Boolean(busy)}
                  onClick={() => run("Actualizar productos", "/em/sync/products", { full: true })}
                  className="border border-white/20 px-3 py-2 text-sm hover:bg-white/5 disabled:opacity-50"
                >
                  Actualizar productos
                </button>
                <button
                  type="button"
                  disabled={Boolean(busy)}
                  onClick={() => run("Actualizar stock", "/em/sync/stock")}
                  className="border border-white/20 px-3 py-2 text-sm hover:bg-white/5 disabled:opacity-50"
                >
                  Actualizar stock
                </button>
                <button
                  type="button"
                  disabled={Boolean(busy)}
                  onClick={() => run("Actualizar imágenes", "/em/sync/images")}
                  className="border border-white/20 px-3 py-2 text-sm hover:bg-white/5 disabled:opacity-50"
                >
                  Actualizar imágenes
                </button>
                <button
                  type="button"
                  disabled={Boolean(busy)}
                  onClick={() => run("Vincular clientes", "/em/sync/clients")}
                  className="border border-white/20 px-3 py-2 text-sm hover:bg-white/5 disabled:opacity-50"
                >
                  Vincular clientes
                </button>
                <button
                  type="button"
                  disabled={Boolean(busy)}
                  onClick={() => run("Actualización completa", "/em/sync/all", { full: true })}
                  className="bg-gold px-3 py-2 text-sm text-black disabled:opacity-50"
                >
                  Actualizar todo
                </button>
              </div>
            </div>

            {busy ? <p className="text-sm text-cream/50">Trabajando…</p> : null}
            {message ? <p className="text-sm text-gold">{message}</p> : null}

            <div>
              <h2 className="mb-3 font-serif text-2xl">Últimas actualizaciones</h2>
              {!status.cursors.some((c) => c.id === "products") ? (
                <p className="mb-3 border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-100">
                  Todavía no se actualizaron los productos de la tienda. Usá <strong>Actualizar productos</strong>.
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
                        <p className="font-medium text-cream">
                          {cursorLabels[cursor.id] ?? cursor.id}
                        </p>
                        <p className="text-cream/50">
                          Última vez:{" "}
                          {cursor.lastAt ? new Date(cursor.lastAt).toLocaleString("es-UY") : "—"}
                        </p>
                        {summary ? (
                          <p className="text-cream/60">
                            Leídos {summary.fetched} · nuevos {summary.created} · actualizados {summary.updated} ·
                            omitidos {summary.skipped}
                            {summary.errors?.length ? ` · con aviso ${summary.errors.length}` : ""}
                          </p>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-cream/50">Todavía no hubo actualizaciones.</p>
              )}
            </div>
          </div>
        )}
      </AdminShell>
    </AdminGate>
  );
}
