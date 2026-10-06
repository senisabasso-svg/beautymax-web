export type EmFamilia = {
  id: number;
  codigo: string;
  nombre: string;
  codigoPadre?: string | null;
  idPadre?: number;
  activa?: boolean;
};

export type EmArticulo = {
  id: number;
  codigo: string;
  codigosBarra?: string | null;
  nombre: string;
  descripcion1?: string | null;
  descripcion2?: string | null;
  descripcion3?: string | null;
  moneda?: string | null;
  precioConImp: number;
  precioSinImp: number;
  impuestoCodigo: number;
  impuestoTasa: number;
  informacion?: string | null;
  familia?: EmFamilia | null;
  stock: number;
  publicar: boolean;
  unidadMedida?: string | null;
  unidadesXPack?: number;
};

export type EmArticuloImagen = {
  articuloId: number;
  articuloCodigo: string;
  articuloNombre: string;
  modificado: string;
  pesoKb: number;
  imagenBase64: string;
};

export type EmArticuloStock = {
  articuloId: number;
  articuloCodigo: string;
  articuloNombre: string;
  modificado: string;
  stock: number;
  publicar: boolean;
};

export type EmCliente = {
  id: number;
  codigo: string;
  nombre: string;
  tipoDocumento: number;
  documento: string;
  razonSocial?: string | null;
  direccion?: string | null;
  ciudad?: string | null;
  listaPrecioCodigo?: string | null;
  descuentoGeneral?: number;
  telefono?: string | null;
  enviarFactura?: boolean;
  enviarFacturaMail?: string | null;
  esGenerico?: boolean;
  activo?: boolean;
  observaciones?: string | null;
};

export type EmDocItem = {
  articuloId: number;
  codigoIngresado: string;
  descripcion: string;
  descripcionAdicional: string;
  unidad: string;
  cantidad: number;
  precioUnitario: number;
  precioOriginal: number;
  impuestoCodigo: number;
  impuestoTasa: number;
  descuentoPorc: number;
  noFacturable: boolean;
  promocion: string;
  grupos: string;
  serie: string;
  utilidad: number;
  subTotalItem: number;
};

export type EmDoc = {
  cabezal: {
    fecha: string;
    nroDoc: number;
    terminal: string;
    tipoDocCodigo: string;
    usuario: string;
    observaciones: string;
  };
  receptor: {
    clienteGenerico: boolean;
    clienteId: number;
    clienteCodigo: string;
    clienteNombre: string;
    receptorTipoDoc: number;
    receptorRazon: string;
    receptorRut: string;
    receptorDireccion: string;
    receptorCiudad: string;
    receptorPais: string;
    receptorMail: string;
    receptorTel: string;
  };
  valorizado: {
    monedaCodigo: string;
    tipoCambio: number;
    formaPagoDias: number;
    listaPrecioCodigo: string;
    importeManual: number;
  };
  detalle: EmDocItem[];
};

export type EmDocRespuesta = {
  terminal?: string;
  tipoDoc?: string;
  nroDoc?: number | string;
};

export type SyncResult = {
  kind: string;
  created: number;
  updated: number;
  skipped: number;
  errors: string[];
  fetched: number;
  cursor: string | null;
};

export type EmEnvelope<T> = {
  ok?: boolean;
  mensaje?: string;
  elemento?: T;
};
