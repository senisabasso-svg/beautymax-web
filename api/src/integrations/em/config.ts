export type EmConfig = {
  enabled: boolean;
  baseUrl: string;
  token: string;
  tokenHeader: string;
  listaPrecio: string;
  deposito: string | null;
  soloWeb: boolean;
  tipoDocPedido: string;
  terminal: string;
  usuario: string;
  monedaCodigo: string;
  tipoCambio: number;
  autoPushOrders: boolean;
  defaultCategory: string;
  defaultBrand: string;
  mediaBaseUrl: string;
  guestAsGeneric: boolean;
};

function envBool(name: string, fallback: boolean) {
  const raw = process.env[name];
  if (raw == null || raw === "") return fallback;
  return ["1", "true", "yes", "on"].includes(raw.toLowerCase());
}

export function getEmConfig(): EmConfig {
  const baseUrl = (process.env.EM_BASE_URL ?? "").replace(/\/$/, "");
  const token = process.env.EM_TOKEN ?? "";
  const mediaBaseUrl = (process.env.PUBLIC_API_URL ?? process.env.EM_MEDIA_BASE_URL ?? "").replace(
    /\/$/,
    "",
  );

  return {
    enabled: envBool("EM_ENABLED", Boolean(baseUrl && token)),
    baseUrl,
    token,
    // Easy Management responde 404 si se usa el header "Token"; usa Authorization Bearer.
    tokenHeader: process.env.EM_TOKEN_HEADER?.trim() || "Authorization",
    listaPrecio: process.env.EM_LISTA_PRECIO ?? "",
    deposito: process.env.EM_DEPOSITO?.trim() || null,
    // En Beautymax hoy no hay artículos con publicarWeb; default false trae activos de VENTA.
    soloWeb: envBool("EM_SOLO_WEB", false),
    tipoDocPedido: process.env.EM_TIPO_DOC_PEDIDO ?? "",
    terminal: process.env.EM_TERMINAL ?? "A",
    usuario: process.env.EM_USUARIO ?? "web",
    monedaCodigo: process.env.EM_MONEDA ?? "1",
    tipoCambio: Number(process.env.EM_TIPO_CAMBIO ?? 1),
    autoPushOrders: envBool("EM_AUTO_PUSH_ORDERS", true),
    defaultCategory: process.env.EM_DEFAULT_CATEGORY ?? "styling",
    defaultBrand: process.env.EM_DEFAULT_BRAND ?? "Beautymax",
    mediaBaseUrl,
    guestAsGeneric: envBool("EM_GUEST_AS_GENERIC", false),
  };
}

export function assertEmConfigured(config = getEmConfig()) {
  if (!config.enabled) {
    throw new Error("Easy Management está deshabilitado (EM_ENABLED / EM_BASE_URL / EM_TOKEN)");
  }
  if (!config.baseUrl) throw new Error("Falta EM_BASE_URL");
  if (!config.token) throw new Error("Falta EM_TOKEN");
  if (!config.listaPrecio) throw new Error("Falta EM_LISTA_PRECIO");
}

export function assertEmOrderConfigured(config = getEmConfig()) {
  assertEmConfigured(config);
  if (!config.tipoDocPedido) throw new Error("Falta EM_TIPO_DOC_PEDIDO");
}
