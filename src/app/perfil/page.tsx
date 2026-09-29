import type { Metadata } from "next";
import { ProfileScreen } from "@/components/client/ProfileScreen";

export const metadata: Metadata = {
  title: "Mi perfil",
  description: "Tus datos, compras y descuentos por invitación en Beautymax.",
};

export default function PerfilPage() {
  return <ProfileScreen />;
}
