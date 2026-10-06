export type EmFamilia = {
  Id: number;
  Codigo: string;
  Nombre: string;
  CodigoPadre?: string | null;
  IdPadre?: number;
  Activa?: boolean;
};

export type EmArticulo = {
  Id: number;
  Codigo: string;
  CodigosBarra?: string | null;
  Nombre: string;
  Descripcion1?: string | null;
  Descripcion2?: string | null;
  Descripcion3?: string | null;
  Moneda?: string | null;
  PrecioConImp: number;
  PrecioSinImp: number;
  ImpuestoCodigo: number;
  ImpuestoTasa: number;
  Informacion?: string | null;
  Familia?: EmFamilia | null;
  Stock: number;
  Publicar: boolean;
  UnidadMedida?: string | null;
  UnidadesXPack?: number;
};

export type EmArticuloImagen = {
  ArticuloId: number;
  ArticuloCodigo: string;
  ArticuloNombre: string;
  Modificado: string;
  PesoKb: number;
  ImagenBase64: string;
};

export type EmArticuloStock = {
  ArticuloId: number;
  ArticuloCodigo: string;
  ArticuloNombre: string;
  Modificado: string;
  Stock: number;
  Publicar: boolean;
};

export type EmCliente = {
  Id: number;
  Codigo: string;
  Nombre: string;
  TipoDocumento: number;
  Documento: string;
  RazonSocial?: string | null;
  Direccion?: string | null;
  Ciudad?: string | null;
  ListaPrecioCodigo?: string | null;
  DescuentoGeneral?: number;
  Telefono?: string | null;
  EnviarFactura?: boolean;
  EnviarFacturaMail?: string | null;
  EsGenerico?: boolean;
  Activo?: boolean;
  Observaciones?: string | null;
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
  Terminal?: string;
  TipoDoc?: string;
  NroDoc?: number | string;
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
