import { assertEmConfigured, getEmConfig, type EmConfig } from "./config.js";
import type {
  EmArticulo,
  EmArticuloImagen,
  EmArticuloStock,
  EmCliente,
  EmDoc,
  EmDocRespuesta,
  EmFamilia,
} from "./types.js";

export class EmApiError extends Error {
  status: number;
  body: string;

  constructor(message: string, status: number, body: string) {
    super(message);
    this.name = "EmApiError";
    this.status = status;
    this.body = body;
  }
}

function formatEmDate(date: Date) {
  return date.toISOString();
}

export function epochCursor() {
  return new Date("2000-01-01T00:00:00.000Z");
}

async function emFetch<T>(
  path: string,
  init: RequestInit = {},
  config: EmConfig = getEmConfig(),
): Promise<T> {
  assertEmConfigured(config);
  const url = `${config.baseUrl}/${path.replace(/^\//, "")}`;
  const headers = new Headers(init.headers);
  headers.set(config.tokenHeader, config.token);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 60_000);
  try {
    const res = await fetch(url, { ...init, headers, signal: controller.signal });
    const text = await res.text();
    if (!res.ok) {
      throw new EmApiError(
        `Easy Management respondió ${res.status} en ${path}`,
        res.status,
        text.slice(0, 500),
      );
    }
    if (!text) return null as T;
    return JSON.parse(text) as T;
  } catch (error) {
    if (error instanceof EmApiError) throw error;
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`Timeout llamando a Easy Management: ${path}`);
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

function withDeposito(path: string, deposito: string | null) {
  return deposito ? `${path}/${encodeURIComponent(deposito)}` : path;
}

export async function listArticulos(options: {
  activos?: boolean;
  soloWeb?: boolean;
  desde: Date;
  config?: EmConfig;
}) {
  const config = options.config ?? getEmConfig();
  const activos = options.activos ?? true;
  const soloWeb = options.soloWeb ?? config.soloWeb;
  const fecha = encodeURIComponent(formatEmDate(options.desde));
  const path = withDeposito(
    `integracion/articulos/${activos}/${soloWeb}/${encodeURIComponent(config.listaPrecio)}/${fecha}`,
    config.deposito,
  );
  return emFetch<EmArticulo[]>(path, {}, config);
}

export async function listStock(options: { activos?: boolean; desde: Date; config?: EmConfig }) {
  const config = options.config ?? getEmConfig();
  const activos = options.activos ?? true;
  const fecha = encodeURIComponent(formatEmDate(options.desde));
  const path = withDeposito(`integracion/stock/${activos}/${fecha}`, config.deposito);
  return emFetch<EmArticuloStock[]>(path, {}, config);
}

export async function listImagenes(options: { activos?: boolean; desde: Date; config?: EmConfig }) {
  const config = options.config ?? getEmConfig();
  const activos = options.activos ?? true;
  const fecha = encodeURIComponent(formatEmDate(options.desde));
  return emFetch<EmArticuloImagen[]>(
    `integracion/articulos/imagenes/${activos}/${fecha}`,
    {},
    config,
  );
}

export async function listFamilias(config = getEmConfig()) {
  return emFetch<EmFamilia[]>("integracion/familias", {}, config);
}

export async function listClientes(all = false, config = getEmConfig()) {
  return emFetch<EmCliente[]>(
    all ? "integracion/clientes/listar/all" : "integracion/clientes/listar",
    {},
    config,
  );
}

export async function getClienteByCodigo(codigo: string, config = getEmConfig()) {
  return emFetch<EmCliente>(
    `integracion/clientes/codigo/${encodeURIComponent(codigo)}`,
    {},
    config,
  );
}

export async function createPedido(doc: EmDoc, config = getEmConfig()) {
  return emFetch<EmDocRespuesta>("integracion/pedido", {
    method: "POST",
    body: JSON.stringify(doc),
  }, config);
}

export async function pingEm(config = getEmConfig()) {
  assertEmConfigured(config);
  // Endpoint liviano para validar token/URL.
  await listFamilias(config);
  return { ok: true as const };
}
