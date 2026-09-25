"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { whatsappUrl } from "@/lib/whatsapp";

export function ContactForm() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (name.trim().length < 2 || message.trim().length < 4) {
      setError("Dejanos tu nombre y el mensaje.");
      return;
    }
    const text = `Hola Beautymax, soy ${name.trim()}${phone.trim() ? ` (${phone.trim()})` : ""}. ${message.trim()}`;
    window.open(whatsappUrl(text), "_blank", "noopener,noreferrer");
    setError("");
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 bg-white p-5 md:p-7" noValidate>
      <div className="space-y-2">
        <Label htmlFor="contacto-nombre">Nombre</Label>
        <Input id="contacto-nombre" value={name} onChange={(event) => setName(event.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="contacto-celular">Celular</Label>
        <Input id="contacto-celular" value={phone} onChange={(event) => setPhone(event.target.value)} inputMode="tel" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="contacto-mensaje">Mensaje</Label>
        <textarea
          id="contacto-mensaje"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          rows={5}
          className="w-full rounded-btn border border-ink/15 bg-white px-3 py-3 text-sm text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-deep"
        />
      </div>
      {error ? (
        <p className="text-xs text-[#7A2E2E]" role="alert">
          {error}
        </p>
      ) : null}
      <Button type="submit">Enviar por WhatsApp</Button>
    </form>
  );
}
