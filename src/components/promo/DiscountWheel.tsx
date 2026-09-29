"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { FormEvent, useEffect, useId, useState, type CSSProperties } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { storeConfig } from "@/config/store";
import { ApiError, apiFetch } from "@/lib/api/client";
import { wheelSegments as fallbackSegments, type PromoCode, type WheelSegment } from "@/lib/promo";
import { useClientAuth, type ClientProfile } from "@/store/client-auth-store";
import { usePromo } from "@/store/promo-store";

const RADIUS = 100;
const INNER = 28;

type AuthMode = "register" | "login" | null;

function polar(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function segmentPath(index: number, total: number) {
  const SEGMENT = 360 / total;
  const start = index * SEGMENT;
  const end = (index + 1) * SEGMENT;
  const large = SEGMENT > 180 ? 1 : 0;
  const a = polar(0, 0, RADIUS, start);
  const b = polar(0, 0, RADIUS, end);
  const c = polar(0, 0, INNER, end);
  const d = polar(0, 0, INNER, start);
  return [
    `M ${a.x} ${a.y}`,
    `A ${RADIUS} ${RADIUS} 0 ${large} 1 ${b.x} ${b.y}`,
    `L ${c.x} ${c.y}`,
    `A ${INNER} ${INNER} 0 ${large} 0 ${d.x} ${d.y}`,
    "Z",
  ].join(" ");
}

const emptyRegister = {
  name: "",
  document: "",
  address: "",
  city: "",
  phone: "",
  salonName: "",
};

export function DiscountWheel() {
  const enabled = storeConfig.discountWheel.enabled;
  const awardCode = usePromo((state) => state.awardCode);
  const applyCode = usePromo((state) => state.applyCode);
  const token = useClientAuth((s) => s.token);
  const client = useClientAuth((s) => s.client);
  const setSession = useClientAuth((s) => s.setSession);
  const refreshMe = useClientAuth((s) => s.refreshMe);
  const reduce = useReducedMotion();
  const uid = useId().replace(/:/g, "");

  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [won, setWon] = useState<PromoCode | null>(null);
  const [segments, setSegments] = useState<WheelSegment[]>(
    fallbackSegments.map((percent) => ({ percent })),
  );
  const [authMode, setAuthMode] = useState<AuthMode>(null);
  const [registerForm, setRegisterForm] = useState(emptyRegister);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [blockedMsg, setBlockedMsg] = useState<string | null>(null);
  const spinDuration = reduce ? 1.4 : 8.2;
  const total = Math.max(segments.length, 1);
  const SEGMENT = 360 / total;

  useEffect(() => {
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready || !enabled) return;
    apiFetch<WheelSegment[]>("/promo/wheel")
      .then((data) => {
        if (data.length) setSegments(data);
      })
      .catch(() => undefined);
  }, [ready, enabled]);

  useEffect(() => {
    if (!ready || !enabled) return;
    const timer = window.setTimeout(() => {
      setWon(null);
      setSpinning(false);
      setRotation(0);
      setAuthMode(null);
      setBlockedMsg(null);
      setOpen(true);
    }, 700);
    return () => window.clearTimeout(timer);
  }, [ready, enabled]);

  useEffect(() => {
    function onOpenAuth(event: Event) {
      const detail = (event as CustomEvent<{ mode?: AuthMode }>).detail;
      setOpen(true);
      setAuthMode(detail?.mode === "login" ? "login" : "register");
      setWon(null);
      setBlockedMsg(null);
    }
    window.addEventListener("bm:open-client-auth", onOpenAuth);
    return () => window.removeEventListener("bm:open-client-auth", onOpenAuth);
  }, []);

  function close() {
    setOpen(false);
    setAuthMode(null);
  }

  async function onRegister(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiFetch("/clients/register", {
        method: "POST",
        body: JSON.stringify(registerForm),
      });
      toast.success("Solicitud enviada. Te avisaremos cuando seas aceptado.");
      setRegisterForm(emptyRegister);
      setAuthMode(null);
      setBlockedMsg("Tu registro quedó pendiente de aceptación. Cuando te aceptemos vas a poder girar.");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo registrar");
    } finally {
      setSubmitting(false);
    }
  }

  async function onLogin(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const result = await apiFetch<{ token: string; client: ClientProfile }>("/clients/login", {
        method: "POST",
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      setSession(result.token, result.client);
      toast.success(`Bienvenido, ${result.client.name}`);
      setAuthMode(null);
      setLoginPassword("");
      if (result.client.hasActiveDiscount && result.client.activeDiscount) {
        setBlockedMsg(
          `Ya tenés el código ${result.client.activeDiscount.code} (${result.client.activeDiscount.percent}% OFF). Usalo en el carrito antes de girar de nuevo.`,
        );
      } else {
        setBlockedMsg(null);
      }
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo iniciar sesión");
    } finally {
      setSubmitting(false);
    }
  }

  async function spin() {
    if (spinning || won) return;

    if (!token || !client || client.status !== "active") {
      setAuthMode(token ? "login" : "register");
      return;
    }

    const fresh = await refreshMe();
    if (fresh?.hasActiveDiscount && fresh.activeDiscount) {
      setBlockedMsg(
        `Ya tenés el código ${fresh.activeDiscount.code} (${fresh.activeDiscount.percent}% OFF). Usalo antes de girar otra vez.`,
      );
      toast.message("Ya tenés un código activo");
      return;
    }

    let percent = segments.find((s) => !s.displayOnly)?.percent ?? segments[0]?.percent ?? 10;
    let remote: PromoCode | null = null;

    try {
      const result = await apiFetch<PromoCode & { segments?: number[] }>("/promo/spin", {
        method: "POST",
        token,
      });
      remote = {
        code: result.code,
        percent: result.percent,
        createdAt: result.createdAt,
      };
      percent = result.percent;
      void refreshMe();
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) {
          setAuthMode("login");
          toast.error("Iniciá sesión para girar");
          return;
        }
        if (err.status === 409) {
          setBlockedMsg(err.message);
          toast.message(err.message);
          return;
        }
        toast.error(err.message);
        return;
      }
      toast.error("No se pudo girar la ruleta");
      return;
    }

    const index = Math.max(
      0,
      segments.findIndex((segment) => segment.percent === percent && !segment.displayOnly),
    );
    const center = index * SEGMENT + SEGMENT / 2;
    const extraTurns = reduce ? 4 : 14 + Math.floor(Math.random() * 4);
    const next = extraTurns * 360 + (360 - center);

    setSpinning(true);
    setBlockedMsg(null);
    requestAnimationFrame(() => {
      setRotation((current) => current + next);
    });

    window.setTimeout(() => {
      const promo = awardCode(percent, remote ?? undefined);
      setWon(promo);
      setSpinning(false);
      toast.success(`¡Ganaste ${percent}% OFF!`);
    }, spinDuration * 1000);
  }

  function usePrize() {
    if (!won) return;
    applyCode(won.code);
    toast.success(`Código ${won.code} listo para el carrito`);
    close();
  }

  function copyCode() {
    if (!won) return;
    void navigator.clipboard?.writeText(won.code);
    toast.success("Código copiado");
  }

  if (!ready || !enabled) return null;

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[60] flex items-end justify-center p-3 sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="ruleta-titulo"
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(201,162,74,0.18),_transparent_55%),_rgba(14,14,14,0.88)]" />

          <motion.div
            className="relative max-h-[94vh] w-full max-w-[420px] overflow-y-auto rounded-[18px] border border-gold/35 bg-[#111111] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.75)]"
            initial={reduce ? false : { y: 28, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={reduce ? undefined : { y: 18, opacity: 0 }}
          >
            <div
              className="pointer-events-none absolute inset-x-8 top-0 h-px"
              style={{ background: "linear-gradient(90deg, transparent, #E8D29A, #C9A24A, #E8D29A, transparent)" }}
            />

            <button
              type="button"
              onClick={close}
              className="absolute right-3 top-3 z-10 inline-flex h-9 items-center rounded-btn border border-white/10 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-gold/90 transition-colors hover:border-gold hover:text-gold"
              aria-label="Cerrar ruleta"
            >
              Cerrar
            </button>

            {authMode ? (
              <div className="px-5 pb-6 pt-10 sm:px-8 sm:pb-8 sm:pt-12">
                <p className="text-[10px] font-semibold uppercase tracking-[0.34em] text-gold">
                  {authMode === "register" ? "Registro profesional" : "Acceso cliente"}
                </p>
                <h2 className="mt-2 font-serif text-2xl text-white sm:text-3xl">
                  {authMode === "register" ? "Registrate para girar" : "Iniciá sesión"}
                </h2>
                {authMode === "register" ? (
                  <p className="mt-3 text-sm leading-relaxed text-white/65">
                    Para registrarte como cliente debés ser profesional del sector cosmética,
                    peluquería o barbería. Revisamos cada solicitud antes de activar precios y
                    descuentos.
                  </p>
                ) : (
                  <p className="mt-3 text-sm leading-relaxed text-white/65">
                    Usá el email y la contraseña que te enviamos por WhatsApp al aceptar tu registro.
                  </p>
                )}

                {authMode === "register" ? (
                  <form onSubmit={onRegister} className="mt-5 space-y-3">
                    {(
                      [
                        ["name", "Nombre", "Tu nombre completo"],
                        ["document", "CI o RUT", "Documento"],
                        ["address", "Dirección", "Calle y número"],
                        ["city", "Ciudad", "Ciudad"],
                        ["phone", "Celular", "09X XXX XXX"],
                        ["salonName", "Nombre de la tienda o centro de cosmética", "Salón / tienda"],
                      ] as const
                    ).map(([key, label, placeholder]) => (
                      <div key={key}>
                        <Label className="text-white/70">{label}</Label>
                        <Input
                          required
                          value={registerForm[key]}
                          onChange={(e) => setRegisterForm((f) => ({ ...f, [key]: e.target.value }))}
                          placeholder={placeholder}
                          className="mt-1.5 border-white/15 bg-black/40 text-white placeholder:text-white/35"
                        />
                      </div>
                    ))}
                    <Button type="submit" className="w-full" disabled={submitting}>
                      {submitting ? "Enviando..." : "Enviar solicitud"}
                    </Button>
                    <button
                      type="button"
                      className="w-full text-center text-xs text-gold/80 underline-offset-2 hover:underline"
                      onClick={() => setAuthMode("login")}
                    >
                      ¿Ya sos cliente? Iniciá sesión
                    </button>
                  </form>
                ) : (
                  <form onSubmit={onLogin} className="mt-5 space-y-3">
                    <div>
                      <Label className="text-white/70">Email</Label>
                      <Input
                        required
                        type="email"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        className="mt-1.5 border-white/15 bg-black/40 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-white/70">Contraseña</Label>
                      <Input
                        required
                        type="password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="mt-1.5 border-white/15 bg-black/40 text-white"
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={submitting}>
                      {submitting ? "Entrando..." : "Entrar y girar"}
                    </Button>
                    <button
                      type="button"
                      className="w-full text-center text-xs text-gold/80 underline-offset-2 hover:underline"
                      onClick={() => setAuthMode("register")}
                    >
                      ¿Todavía no te registraste? Pedí acceso
                    </button>
                  </form>
                )}
              </div>
            ) : (
              <>
                <div className="px-5 pb-1 pt-7 text-center sm:px-8 sm:pt-10">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.34em] text-gold">Promo Beautymax</p>
                  <h2
                    id="ruleta-titulo"
                    className="mx-auto mt-2.5 max-w-[16ch] font-serif text-[1.75rem] font-semibold leading-[1.1] text-white sm:mt-3 sm:text-[2.35rem]"
                  >
                    {storeConfig.discountWheel.title}
                  </h2>
                  <div
                    className="mx-auto mt-3 h-px w-16 sm:mt-4"
                    style={{ background: "linear-gradient(90deg, #9A7B2F, #E8D29A, #C9A24A)" }}
                  />
                  <p className="mx-auto mt-3 hidden max-w-sm text-[13px] leading-relaxed text-white/60 sm:mt-4 sm:block">
                    {storeConfig.discountWheel.subtitle}
                  </p>
                  {client?.status === "active" ? (
                    <p className="mt-2 text-[11px] text-gold/80">Sesión: {client.name}</p>
                  ) : null}
                </div>

                <div className="relative px-4 pb-1 pt-2 sm:px-6 sm:pt-4">
                  <div
                    className={`relative z-20 mx-auto -mb-2 flex w-fit flex-col items-center sm:-mb-3 ${spinning && !reduce ? "wheel-pointer-live" : ""}`}
                  >
                    <div
                      className="h-2.5 w-2.5 rotate-45 border border-[#E8D29A] sm:h-3 sm:w-3"
                      style={{
                        background: "linear-gradient(135deg, #E8D29A 0%, #C9A24A 45%, #9A7B2F 100%)",
                        boxShadow: spinning
                          ? "0 0 28px rgba(232,210,154,0.95), 0 0 48px rgba(201,162,74,0.55)"
                          : "0 0 18px rgba(201,162,74,0.55)",
                      }}
                    />
                    <div
                      className="mt-[-2px] h-0 w-0 border-l-[8px] border-r-[8px] border-t-[12px] border-l-transparent border-r-transparent border-t-[#C9A24A] sm:border-l-[9px] sm:border-r-[9px] sm:border-t-[14px]"
                      style={{ filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.45))" }}
                    />
                  </div>

                  <div className="relative mx-auto aspect-square w-[min(100%,240px)] overflow-visible sm:w-[300px]">
                    <div
                      className={`absolute inset-[-10%] rounded-full ${spinning && !reduce ? "wheel-aura" : ""}`}
                      style={{
                        background: spinning
                          ? "radial-gradient(circle, rgba(232,210,154,0.55) 0%, rgba(201,162,74,0.28) 42%, transparent 72%)"
                          : "radial-gradient(circle, rgba(201,162,74,0.28) 0%, transparent 68%)",
                        opacity: spinning ? 1 : 0.7,
                      }}
                    />

                    {spinning && !reduce ? (
                      <>
                        {[
                          { left: "8%", delay: "0s", x: "-28px", size: 86 },
                          { left: "22%", delay: "0.35s", x: "-18px", size: 70 },
                          { left: "38%", delay: "0.7s", x: "-8px", size: 92 },
                          { left: "55%", delay: "0.15s", x: "10px", size: 78 },
                          { left: "70%", delay: "0.55s", x: "22px", size: 88 },
                          { left: "84%", delay: "0.9s", x: "30px", size: 68 },
                          { left: "48%", delay: "1.1s", x: "0px", size: 96 },
                          { left: "30%", delay: "1.35s", x: "-22px", size: 74 },
                        ].map((puff, index) => (
                          <span
                            key={`smoke-${index}`}
                            className="wheel-smoke"
                            style={
                              {
                                left: puff.left,
                                marginLeft: 0,
                                width: puff.size,
                                height: puff.size,
                                animationDelay: puff.delay,
                                "--smoke-x": puff.x,
                              } as CSSProperties
                            }
                          />
                        ))}
                        {[
                          { left: "18%", delay: "0.1s", x: "-12px" },
                          { left: "35%", delay: "0.4s", x: "-4px" },
                          { left: "50%", delay: "0.2s", x: "6px" },
                          { left: "65%", delay: "0.65s", x: "14px" },
                          { left: "78%", delay: "0.85s", x: "20px" },
                          { left: "42%", delay: "1s", x: "-2px" },
                        ].map((ember, index) => (
                          <span
                            key={`ember-${index}`}
                            className="wheel-ember"
                            style={
                              {
                                left: ember.left,
                                marginLeft: 0,
                                animationDelay: ember.delay,
                                "--ember-x": ember.x,
                              } as CSSProperties
                            }
                          />
                        ))}
                      </>
                    ) : null}

                    <motion.div
                      data-wheel-spin
                      className="absolute inset-0 rounded-full"
                      animate={{ rotate: rotation }}
                      transition={
                        spinning
                          ? {
                              duration: spinDuration,
                              ease: [0.08, 0.72, 0.08, 1],
                            }
                          : { duration: 0 }
                      }
                      style={{
                        filter: spinning
                          ? "drop-shadow(0 18px 28px rgba(0,0,0,0.45)) drop-shadow(0 0 26px rgba(201,162,74,0.45))"
                          : "drop-shadow(0 18px 28px rgba(0,0,0,0.45))",
                        willChange: "transform",
                      }}
                    >
                      <svg viewBox="-120 -120 240 240" className="h-full w-full" aria-hidden="true">
                        <defs>
                          <linearGradient id={`${uid}-gold`} x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor="#E8D29A" />
                            <stop offset="45%" stopColor="#C9A24A" />
                            <stop offset="100%" stopColor="#9A7B2F" />
                          </linearGradient>
                          <linearGradient id={`${uid}-ink`} x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor="#2A2A2A" />
                            <stop offset="100%" stopColor="#0E0E0E" />
                          </linearGradient>
                          <radialGradient id={`${uid}-hub`} cx="35%" cy="30%" r="75%">
                            <stop offset="0%" stopColor="#E8D29A" />
                            <stop offset="55%" stopColor="#C9A24A" />
                            <stop offset="100%" stopColor="#7A6124" />
                          </radialGradient>
                          <filter id={`${uid}-soft`} x="-20%" y="-20%" width="140%" height="140%">
                            <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000" floodOpacity="0.35" />
                          </filter>
                        </defs>

                        <circle r="112" fill={`url(#${uid}-gold)`} opacity="0.95" />
                        <circle r="106" fill="#0E0E0E" />

                        {segments.map((segment, index) => {
                          const mid = index * SEGMENT + SEGMENT / 2;
                          const label = polar(0, 0, 68, mid);
                          const isGold = !segment.displayOnly && segment.percent >= 20;
                          return (
                            <g key={`${segment.percent}-${index}`}>
                              <path
                                d={segmentPath(index, total)}
                                fill={isGold ? `url(#${uid}-gold)` : `url(#${uid}-ink)`}
                                stroke="rgba(232,210,154,0.28)"
                                strokeWidth="0.8"
                                opacity={segment.displayOnly ? 0.55 : 1}
                              />
                              <text
                                x={label.x}
                                y={label.y}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                fill={isGold ? "#0E0E0E" : "#E8D29A"}
                                fontFamily="var(--font-sans), Montserrat, sans-serif"
                                fontSize="13"
                                fontWeight="600"
                                letterSpacing="0.06em"
                                transform={`rotate(${mid} ${label.x} ${label.y})`}
                              >
                                {segment.percent}%
                              </text>
                            </g>
                          );
                        })}

                        {Array.from({ length: 48 }).map((_, index) => {
                          const angle = (index * 360) / 48;
                          const outer = polar(0, 0, 104, angle);
                          const inner = polar(0, 0, index % 2 === 0 ? 98 : 100, angle);
                          return (
                            <line
                              key={index}
                              x1={inner.x}
                              y1={inner.y}
                              x2={outer.x}
                              y2={outer.y}
                              stroke="#E8D29A"
                              strokeWidth={index % 2 === 0 ? 1.4 : 0.7}
                              opacity={index % 2 === 0 ? 0.85 : 0.45}
                            />
                          );
                        })}

                        <circle r="27" fill={`url(#${uid}-hub)`} filter={`url(#${uid}-soft)`} />
                        <circle r="22" fill="#0E0E0E" />
                        <text
                          x="0"
                          y="1"
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fill="#E8D29A"
                          fontFamily="var(--font-serif), Georgia, serif"
                          fontSize="12"
                          fontWeight="600"
                          letterSpacing="0.12em"
                        >
                          BM
                        </text>
                      </svg>
                    </motion.div>
                  </div>
                </div>

                <div className="px-5 pb-6 pt-2 sm:px-8 sm:pb-8 sm:pt-3">
                  {blockedMsg ? (
                    <p className="mb-3 text-center text-xs leading-relaxed text-gold/85">{blockedMsg}</p>
                  ) : null}
                  {won ? (
                    <motion.div
                      className="text-center"
                      initial={reduce ? false : { opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-gold">
                        Tu código de un solo uso
                      </p>
                      <p className="mt-1.5 font-serif text-3xl text-white sm:mt-2 sm:text-4xl">
                        {won.percent}% OFF
                      </p>
                      <button
                        type="button"
                        onClick={copyCode}
                        className="mt-3 inline-flex min-w-[12rem] items-center justify-center rounded-btn border border-gold/50 bg-black/40 px-5 py-3 font-sans text-sm font-semibold tracking-[0.18em] text-gold transition-colors hover:border-gold hover:bg-black/60 sm:mt-4"
                      >
                        {won.code}
                      </button>
                      <p className="mt-2 text-xs text-white/55 sm:mt-3">
                        Tocá el código para copiarlo. Aplicálo al pagar.
                      </p>
                      <div className="mt-4 grid gap-2 sm:mt-5 sm:grid-cols-2">
                        <Button type="button" onClick={usePrize}>
                          Usar en el carrito
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          className="border-white/20 text-white hover:border-gold hover:bg-gold hover:text-black"
                          onClick={close}
                        >
                          Seguir comprando
                        </Button>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="text-center">
                      <p className="mb-3 text-[11px] text-white/55 sm:hidden">
                        Solo clientes profesionales · un código a la vez
                      </p>
                      <Button
                        type="button"
                        size="lg"
                        className="min-w-[11rem] shadow-[0_0_28px_rgba(201,162,74,0.28)]"
                        onClick={() => void spin()}
                        disabled={spinning}
                      >
                        {spinning
                          ? "¡Girando...!"
                          : token && client?.status === "active"
                            ? "Girar"
                            : "Registrarme / Girar"}
                      </Button>
                      <p className="mt-3 hidden text-[11px] uppercase tracking-[0.18em] text-white/45 sm:block">
                        Solo profesionales · un código hasta usarlo
                      </p>
                      {token && client?.status === "active" ? null : (
                        <button
                          type="button"
                          className="mt-3 text-xs text-gold/80 underline-offset-2 hover:underline"
                          onClick={() => setAuthMode("login")}
                        >
                          Ya soy cliente — iniciar sesión
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
