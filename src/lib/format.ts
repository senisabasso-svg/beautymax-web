import { storeConfig } from "@/config/store";

export function formatPrice(amount: number) {
  const formatted = new Intl.NumberFormat(storeConfig.locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
  return `$U ${formatted}`;
}

export function formatDate(date: Date) {
  return new Intl.DateTimeFormat(storeConfig.locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
