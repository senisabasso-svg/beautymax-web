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

export default function AdminEmPage() {
  const [status, setStatus] = useState<EmStatus | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<unknown>(null);

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
              <p className="mt-1 text-cream/50">
                Auth: header Authorization Bearer. Si Solo web=sí y EM no marca publicarWeb, el sync trae 0
                productos.
              </p>
              <p>
                Brand / categoría default:{" "}
                <span className="text-cream">
                  {status.defaultBrand} / {status.defaultCategory}
                </span>
              </p>
              <p className="mt-2 text-cream/50">
                Configurá `EM_*` en el `.env` del API (Railway). El front nunca habla con HYC.
              </p>
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

            {status.cursors.length > 0 ? (
              <div>
                <h2 className="mb-3 font-serif text-2xl">Cursores</h2>
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
              </div>
            ) : null}

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
