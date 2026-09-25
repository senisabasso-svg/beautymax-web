"use client";

import { Toaster as Sonner } from "sonner";

export function Toaster() {
  return (
    <Sonner
      position="top-center"
      toastOptions={{
        style: {
          background: "#0E0E0E",
          color: "#F7F4EE",
          border: "1px solid #C9A24A",
          borderRadius: "6px",
          fontFamily: "var(--font-sans), sans-serif",
        },
      }}
    />
  );
}
