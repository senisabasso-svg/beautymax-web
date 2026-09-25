import { storeConfig } from "@/config/store";
import { freeShippingRemaining } from "@/lib/cart";
import { formatPrice } from "@/lib/format";

export function FreeShippingBar({ subtotal }: { subtotal: number }) {
  const remaining = freeShippingRemaining(subtotal);
  const progress = Math.min(100, (subtotal / storeConfig.freeShippingFrom) * 100);

  return (
    <div>
      <p className="text-sm text-ink">
        {remaining === 0
          ? "Tenés envío gratis en este pedido."
          : `Te faltan ${formatPrice(remaining)} para envío gratis.`}
      </p>
      <div className="mt-3 h-1.5 w-full bg-black/10" aria-hidden="true">
        <div className="gold-line h-full" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}
