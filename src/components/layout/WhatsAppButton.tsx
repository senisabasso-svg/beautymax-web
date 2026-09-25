import { MessageCircle } from "lucide-react";
import { storeConfig } from "@/config/store";
import { generalMessage, whatsappUrl } from "@/lib/whatsapp";

export function WhatsAppButton() {
  return (
    <a
      href={whatsappUrl(generalMessage())}
      target="_blank"
      rel="noreferrer"
      aria-label={`Escribir por WhatsApp al ${storeConfig.whatsappDisplay}`}
      className="fixed bottom-4 right-4 z-30 inline-flex h-14 w-14 items-center justify-center rounded-full border border-gold bg-black text-gold shadow-soft transition-colors hover:bg-gold hover:text-black"
    >
      <MessageCircle className="h-6 w-6" strokeWidth={1.25} />
    </a>
  );
}
