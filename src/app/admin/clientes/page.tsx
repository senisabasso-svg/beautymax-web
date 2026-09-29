"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AdminGate } from "@/components/admin/AdminGate";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { getAdminToken } from "@/lib/api/admin-auth";
import { ApiError, apiFetch } from "@/lib/api/client";
import { clientAcceptedMessage, clientWhatsAppUrl } from "@/lib/client-whatsapp";

type ClientRow = {
  id: string;
  name: string;
  document: string;
  address: string;
  city: string;
  phone: string;
  salonName: string;
  email: string | null;
  status: string;
  createdAt: string;
  hasActiveDiscount: boolean;
  activeDiscount: { code: string; percent: number } | null;
  referredBy: { id: string; name: string; salonName: string } | null;
};

type Tab = "pending" | "active";

export default function AdminClientsPage() {
  const [tab, setTab] = useState<Tab>("pending");
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [credentialsById, setCredentialsById] = useState<
    Record<string, { email: string; password: string; siteUrl: string }>
  >({});

  function load(status: Tab) {
    const token = getAdminToken();
    if (!token) return;
    setLoading(true);
    apiFetch<ClientRow[]>(`/clients?status=${status}`, { token })
      .then(setClients)
      .catch((err) => toast.error(err instanceof ApiError ? err.message : "Error al cargar"))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load(tab);
  }, [tab]);

  const title = useMemo(
    () => (tab === "pending" ? "Pendientes de aceptar" : "Clientes activos"),
    [tab],
  );

  async function approve(client: ClientRow) {
    const token = getAdminToken();
    if (!token) return;
    setApprovingId(client.id);
    try {
      const result = await apiFetch<{
        client: ClientRow;
        credentials: { email: string; password: string | null; siteUrl: string };
      }>(`/clients/${client.id}/approve`, { method: "PATCH", token });

      if (result.credentials.password) {
        const creds = {
          email: result.credentials.email,
          password: result.credentials.password!,
          siteUrl: result.credentials.siteUrl,
        };
        setCredentialsById((prev) => ({
          ...prev,
          [client.id]: creds,
        }));
        const href = clientWhatsAppUrl(
          client.phone,
          clientAcceptedMessage({
            name: client.name,
            siteUrl: creds.siteUrl,
            email: creds.email,
            password: creds.password,
          }),
        );
        window.open(href, "_blank", "noopener,noreferrer");
      }

      toast.success(`${client.name} aceptado — se abrió WhatsApp`);
      setClients((list) =>
        list.map((c) =>
          c.id === client.id
            ? { ...result.client, phone: client.phone, name: client.name, referredBy: client.referredBy }
            : c,
        ),
      );
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo aceptar");
    } finally {
      setApprovingId(null);
    }
  }

  async function reject(client: ClientRow) {
    if (!confirm(`¿Eliminar la solicitud de ${client.name}?`)) return;
    const token = getAdminToken();
    if (!token) return;
    try {
      await apiFetch(`/clients/${client.id}/reject`, { method: "PATCH", token });
      setClients((list) => list.filter((c) => c.id !== client.id));
      toast.success("Solicitud eliminada");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo eliminar");
    }
  }

  function whatsappHref(client: ClientRow) {
    const creds = credentialsById[client.id];
    if (!creds) return null;
    return clientWhatsAppUrl(
      client.phone,
      clientAcceptedMessage({
        name: client.name,
        siteUrl: creds.siteUrl,
        email: creds.email,
        password: creds.password,
      }),
    );
  }

  return (
    <AdminGate>
      <AdminShell title="Clientes">
        <div className="mb-6 flex flex-wrap gap-2">
          <Button
            type="button"
            variant={tab === "pending" ? "gold" : "outline"}
            className={tab !== "pending" ? "border-white/20 text-cream" : undefined}
            onClick={() => setTab("pending")}
          >
            Pendientes de aceptar
          </Button>
          <Button
            type="button"
            variant={tab === "active" ? "gold" : "outline"}
            className={tab !== "active" ? "border-white/20 text-cream" : undefined}
            onClick={() => setTab("active")}
          >
            Activos
          </Button>
        </div>

        <p className="mb-4 text-sm text-cream/50">{title}</p>

        {loading ? (
          <p className="text-cream/50">Cargando…</p>
        ) : clients.length === 0 ? (
          <p className="text-cream/50">No hay clientes en esta lista.</p>
        ) : (
          <div className="space-y-4">
            {clients.map((client) => {
              const wa = whatsappHref(client);
              return (
                <article key={client.id} className="border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="font-serif text-xl text-cream">{client.name}</h2>
                      <p className="mt-1 text-sm text-cream/60">{client.salonName}</p>
                      {client.referredBy ? (
                        <p className="mt-2 text-sm text-gold">
                          Pidió el alta gracias a {client.referredBy.name}
                          {client.referredBy.salonName ? ` · ${client.referredBy.salonName}` : ""}
                        </p>
                      ) : null}
                    </div>
                    {client.hasActiveDiscount && client.activeDiscount ? (
                      <span className="rounded-sm bg-gold/15 px-2 py-1 text-xs font-semibold text-gold">
                        Código {client.activeDiscount.code} · {client.activeDiscount.percent}%
                      </span>
                    ) : tab === "active" ? (
                      <span className="text-xs text-cream/40">Sin código activo</span>
                    ) : null}
                  </div>

                  <dl className="mt-4 grid gap-2 text-sm text-cream/70 sm:grid-cols-2">
                    <div>
                      <dt className="text-[10px] uppercase tracking-wider text-cream/40">CI / RUT</dt>
                      <dd>{client.document}</dd>
                    </div>
                    <div>
                      <dt className="text-[10px] uppercase tracking-wider text-cream/40">Celular</dt>
                      <dd>{client.phone}</dd>
                    </div>
                    <div>
                      <dt className="text-[10px] uppercase tracking-wider text-cream/40">Ciudad</dt>
                      <dd>{client.city}</dd>
                    </div>
                    <div>
                      <dt className="text-[10px] uppercase tracking-wider text-cream/40">Dirección</dt>
                      <dd>{client.address}</dd>
                    </div>
                    {client.email ? (
                      <div className="sm:col-span-2">
                        <dt className="text-[10px] uppercase tracking-wider text-cream/40">Email</dt>
                        <dd className="font-mono text-gold/90">{client.email}</dd>
                      </div>
                    ) : null}
                  </dl>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {tab === "pending" && client.status !== "active" ? (
                      <>
                        <Button
                          type="button"
                          disabled={approvingId === client.id}
                          onClick={() => void approve(client)}
                        >
                          {approvingId === client.id ? "Aceptando…" : "Aceptar"}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          className="border-white/20 text-cream"
                          onClick={() => void reject(client)}
                        >
                          Rechazar
                        </Button>
                      </>
                    ) : null}

                    {wa ? (
                      <Button asChild variant="outline" className="border-gold/40 text-gold">
                        <a href={wa} target="_blank" rel="noreferrer">
                          WhatsApp con credenciales
                        </a>
                      </Button>
                    ) : null}

                    {credentialsById[client.id] ? (
                      <p className="w-full text-xs text-cream/50">
                        Credenciales generadas. Enviáselas al cliente por WhatsApp.
                      </p>
                    ) : null}
                  </div>

                  {credentialsById[client.id] ? (
                    <div className="mt-3 rounded border border-gold/25 bg-black/30 p-3 text-xs text-cream/70">
                      <p>
                        Email:{" "}
                        <span className="font-mono text-gold">{credentialsById[client.id].email}</span>
                      </p>
                      <p className="mt-1">
                        Contraseña:{" "}
                        <span className="font-mono text-gold">{credentialsById[client.id].password}</span>
                      </p>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        )}
      </AdminShell>
    </AdminGate>
  );
}
