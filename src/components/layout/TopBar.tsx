"use client";

import { useEffect, useState } from "react";
import { storeConfig } from "@/config/store";

export function TopBar() {
  const messages = storeConfig.topBar;
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (media.matches) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % messages.length);
    }, 3600);
    return () => window.clearInterval(timer);
  }, [messages.length]);

  return (
    <div className="bg-black text-cream">
      <p className="px-4 py-2 text-center text-[11px] font-medium uppercase tracking-[0.14em] lg:hidden">{messages[index]}</p>
      <p className="hidden px-4 py-2 text-center text-[11px] font-medium uppercase tracking-[0.12em] lg:block">
        {messages.join("  ·  ")}
      </p>
    </div>
  );
}
