"use client";

import { Download, Share, X } from "lucide-react";
import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "beautymax-pwa-dismiss";

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone))
  );
}

function isIos() {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

export function PwaInstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [iosHint, setIosHint] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;
    if (localStorage.getItem(DISMISS_KEY) === "1") return;

    if (isIos()) {
      const timer = window.setTimeout(() => {
        setIosHint(true);
        setVisible(true);
      }, 12000);
      return () => window.clearTimeout(timer);
    }

    const onPrompt = (event: Event) => {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
    setDeferred(null);
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    const choice = await deferred.userChoice;
    if (choice.outcome === "accepted") {
      setVisible(false);
    }
    setDeferred(null);
  };

  return (
    <div className="fixed inset-x-4 bottom-20 z-40 mx-auto max-w-md rounded-sm border border-gold/40 bg-black px-4 py-3 text-white shadow-soft sm:bottom-6">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-gold/15 text-gold">
          <Download className="h-4 w-4" strokeWidth={1.5} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-gold">Instalá Beautymax</p>
          {iosHint ? (
            <p className="mt-1 text-[12px] leading-relaxed text-white/75">
              En Safari tocá <Share className="mx-0.5 inline h-3.5 w-3.5 text-gold" strokeWidth={1.5} aria-hidden /> Compartir
              y después &quot;Agregar a pantalla de inicio&quot;.
            </p>
          ) : (
            <p className="mt-1 text-[12px] leading-relaxed text-white/75">
              Agregala a tu celular para abrirla como app, más rápido y sin barra del navegador.
            </p>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {!iosHint && deferred ? (
              <button
                type="button"
                onClick={() => void install()}
                className="inline-flex h-9 items-center bg-gold px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-black transition-colors hover:bg-gold-light"
              >
                Instalar
              </button>
            ) : null}
            <button
              type="button"
              onClick={dismiss}
              className="inline-flex h-9 items-center px-2 text-[11px] font-medium uppercase tracking-[0.12em] text-white/55 transition-colors hover:text-white"
            >
              Ahora no
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center text-white/50 hover:text-white"
          aria-label="Cerrar"
        >
          <X className="h-4 w-4" strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );
}
