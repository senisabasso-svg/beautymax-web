"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { getApiUrl } from "@/lib/api/client";

function sessionId(storage: Storage) {
  const key = "bm-session";
  const current = storage.getItem(key);
  if (current) return current;
  const next = `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
  storage.setItem(key, next);
  return next;
}

export function VisitTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin")) return;
    let storage: Storage;
    try {
      storage = window.sessionStorage;
    } catch {
      return;
    }
    const day = new Date().toISOString().slice(0, 10);
    const seenKey = `bm-hit:${day}:${pathname}`;
    if (storage.getItem(seenKey)) return;
    storage.setItem(seenKey, "1");

    const slug = pathname.match(/^\/producto\/([^/]+)/)?.[1];
    void fetch(`${getApiUrl()}/analytics`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify({
        path: pathname,
        kind: slug ? "product" : "page",
        label: slug ? decodeURIComponent(slug) : pathname,
        sessionId: sessionId(storage),
      }),
    }).catch(() => undefined);
  }, [pathname]);

  return null;
}
