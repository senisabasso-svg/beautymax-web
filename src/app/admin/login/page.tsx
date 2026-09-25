"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { setAdminToken } from "@/lib/api/admin-auth";
import { apiFetch } from "@/lib/api/client";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@beautymax.uy");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    setError("");
    try {
      const data = await apiFetch<{ token: string }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      setAdminToken(data.token);
      router.replace("/admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo entrar");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#111] px-4">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-5 border border-white/10 bg-black/40 p-8">
        <div>
          <p className="font-serif text-3xl text-gold">Beautymax</p>
          <p className="mt-1 text-sm text-cream/60">Acceso al panel</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="email" className="text-cream/80">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border-white/20 bg-black text-cream"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password" className="text-cream/80">
            Contraseña
          </Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border-white/20 bg-black text-cream"
            required
          />
        </div>
        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Entrando…" : "Entrar"}
        </Button>
      </form>
    </div>
  );
}
