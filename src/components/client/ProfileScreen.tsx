"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { openClientLogin } from "@/components/client/PriceGate";
import { PageHero } from "@/components/layout/PageHero";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { ApiError, apiFetch } from "@/lib/api/client";
import { formatDate, formatPrice } from "@/lib/format";
import { useClientAuth, type ClientProfile } from "@/store/client-auth-store";

type Referral = {
  id: string;
  name: string;
  salonName: string;
  status: string;
  createdAt: string;
  reward: { code: string; percent: number; usedAt: string | null } | null;
};

type ProfileOrder = {
  id: string;
  publicId: string;
  status: string;
  createdAt: string;
  delivery: string;
  payment: string;
  department: string;
  city: string;
  address: string | null;
  shipping: number;
  discount: number;
  total: number;
  items: Array<{ name: string; brand: string; variantLabel: string; quantity: number; lineTotal: number }>;
};

type ProfilePayload = {
  client: ClientProfile;
  referralCode: string | null;
  referralPercent: number;
  referrals: Referral[];
  orders: ProfileOrder[];
};

const statusLabel: Record<string, string> = {
  nuevo: "Nuevo",
  confirmado: "Confirmado",
  enviado: "Enviado",
  entregado: "Entregado",
  cancelado: "Cancelado",
  pending: "Pendiente de alta",
  active: "Activo",
};

export function ProfileScreen() {
  const ready = useClientAuth((s) => s.ready);
  const token = useClientAuth((s) => s.token);
  const [profile, setProfile] = useState<ProfilePayload | null>(null);
  const [error, setError] = useState("");
  const [inviteUrl, setInviteUrl] = useState("");

  useEffect(() => {
    if (!ready || !token) return;
    apiFetch<ProfilePayload>("/clients/me/profile", { token })
      .then((data) => {
        setProfile(data);
        if (data.referralCode) setInviteUrl(`${window.location.origin}/?ref=${data.referralCode}`);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "No se pudo cargar el perfil"));
  }, [ready, token]);

  return (
    <>
      <PageHero
        eyebrow="Cliente"
        title="Mi perfil"
        description="Tus datos, los envíos de tus compras y los descuentos por invitaciones."
      />
      <Container className="py-12 md:py-16">
        {!ready ? <p className="text-ink/60">Cargando…</p> : null}
        {ready && !token ? (
          <div className="max-w-lg border border-ink/10 bg-white p-6">
            <p className="font-serif text-3xl text-ink">Iniciá sesión para ver tu perfil</p>
            <Button type="button" className="mt-6" onClick={openClientLogin}>
              Ingresar como cliente
            </Button>
          </div>
        ) : null}
        {error ? <p className="text-red-700">{error}</p> : null}
        {profile ? (
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <section className="border border-ink/10 bg-white p-6">
              <p className="text-[11px] font-semibold uppercase tracking-section text-ink/50">Datos</p>
              <h2 className="mt-2 font-serif text-3xl text-ink">{profile.client.name}</h2>
              <p className="mt-1 text-ink/70">{profile.client.salonName}</p>
              <dl className="mt-6 space-y-3 text-sm text-ink/80">
                <Row label="Email" value={profile.client.email ?? "—"} />
                <Row label="Celular" value={profile.client.phone} />
                <Row label="CI / RUT" value={profile.client.document} />
                <Row label="Ciudad" value={profile.client.city} />
                <Row label="Dirección" value={profile.client.address} />
              </dl>
            </section>

            <section className="border border-ink/10 bg-white p-6">
              <p className="text-[11px] font-semibold uppercase tracking-section text-ink/50">Invitaciones</p>
              <h2 className="mt-2 font-serif text-3xl text-ink">Amigos que se registraron</h2>
              {inviteUrl ? (
                <p className="mt-3 break-all text-sm text-ink/60">{inviteUrl}</p>
              ) : null}
              {profile.referrals.length === 0 ? (
                <p className="mt-4 text-sm text-ink/60">
                  Todavía nadie se registró con tu link. Cuando lo hagan, acá aparece un {profile.referralPercent}% OFF.
                </p>
              ) : (
                <ul className="mt-4 divide-y divide-ink/10">
                  {profile.referrals.map((referral) => (
                    <li key={referral.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                      <div>
                        <p className="font-medium text-ink">{referral.name}</p>
                        <p className="text-sm text-ink/60">
                          {referral.salonName} · {statusLabel[referral.status] ?? referral.status}
                        </p>
                      </div>
                      {referral.reward ? (
                        <div className="text-right">
                          <p className="font-semibold tracking-wide text-gold-deep">{referral.reward.code}</p>
                          <p className="text-xs text-ink/50">
                            {referral.reward.percent}% OFF
                            {referral.reward.usedAt ? " · usado" : " · disponible"}
                          </p>
                        </div>
                      ) : (
                        <p className="text-xs text-ink/40">Sin código</p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              {inviteUrl ? (
                <Button
                  type="button"
                  className="mt-4"
                  onClick={() => {
                    void navigator.clipboard?.writeText(inviteUrl);
                    toast.success("Link copiado");
                  }}
                >
                  Copiar link de invitación
                </Button>
              ) : null}
            </section>

            <section className="border border-ink/10 bg-white p-6 lg:col-span-2">
              <p className="text-[11px] font-semibold uppercase tracking-section text-ink/50">Compras</p>
              <h2 className="mt-2 font-serif text-3xl text-ink">Pedidos y envíos</h2>
              {profile.orders.length === 0 ? (
                <p className="mt-4 text-sm text-ink/60">Todavía no hay compras asociadas a tu cuenta.</p>
              ) : (
                <div className="mt-6 space-y-4">
                  {profile.orders.map((order) => (
                    <article key={order.id} className="border border-ink/10 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="font-medium text-ink">{order.publicId}</p>
                          <p className="text-xs text-ink/50">{formatDate(new Date(order.createdAt))}</p>
                        </div>
                        <p className="font-serif text-2xl text-ink">{formatPrice(order.total)}</p>
                      </div>
                      <dl className="mt-3 grid gap-2 text-sm text-ink/75 sm:grid-cols-2">
                        <Row label="Estado" value={statusLabel[order.status] ?? order.status} />
                        <Row label="Entrega" value={order.delivery === "retiro" ? "Retiro" : "Envío"} />
                        <Row label="Destino" value={`${order.city}, ${order.department}`} />
                        <Row label="Dirección" value={order.address || "—"} />
                        <Row label="Envío" value={order.shipping ? formatPrice(order.shipping) : "Sin costo"} />
                        <Row label="Pago" value={order.payment} />
                      </dl>
                      <ul className="mt-3 space-y-1 text-sm text-ink/70">
                        {order.items.map((item, index) => (
                          <li key={`${order.id}-${index}`}>
                            {item.quantity} × {item.name} ({item.variantLabel}) · {formatPrice(item.lineTotal)}
                          </li>
                        ))}
                      </ul>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>
        ) : null}
      </Container>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink/40">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
