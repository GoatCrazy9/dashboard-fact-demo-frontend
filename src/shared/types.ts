export type TipoComprobante =
  | 'FACTURA'
  | 'BOLETA'
  | 'NOTA_CREDITO'
  | 'NOTA_DEBITO'
  | 'GUIA_REMISION'

export type EstadoComprobante =
  | 'BORRADOR'
  | 'EMITIDO'
  | 'ACEPTADO'
  | 'RECHAZADO'
  | 'ANULADO'

export interface Cliente {
  id: string
  tipoDocumento: 'DNI' | 'RUC' | 'CE'
  numeroDocumento: string
  razonSocial: string
  direccion: string | null
  email: string | null
  telefono: string | null
  ubigeo?: string | null
}

export interface Producto {
  id: string
  codigo: string
  descripcion: string
  unidad: string
  precioUnitario: number
  afectoIgv: boolean
  stock: number
}

export interface MovimientoStock {
  id: string
  tipo: 'ENTRADA' | 'SALIDA' | 'VENTA'
  cantidad: number
  motivo: string | null
  stockAnterior: number
  stockPosterior: number
  creadoEn: string
  usuario: string | null
  comprobante: string | null
}

export interface ComprobanteResumen {
  id: string
  clienteId: string
  tipo: TipoComprobante
  serie: string
  numero: number
  fecha: string
  cliente: string
  clienteDocumento: string
  clienteDireccion: string | null
  clienteTelefono: string | null
  creadoEn: string
  subtotal: number
  igv: number
  total: number
  moneda: string
  tipoCambio: number
  estado: EstadoComprobante
  sunatCodigo: string | null
  sunatMensaje: string | null
  sunatTicket: string | null
  archivos: { xml: boolean; zip: boolean; cdr: boolean }
  documentoAfectado: string | null
  motivoNota: string | null
  motivoAnulacion: string | null
  anuladoEn: string | null
  detraccionCodigo: string
  detraccionTasa: number
  detraccionMonto: number
}

export interface Detraccion {
  codigo: string
  nombre: string
  tasa: number
}

export interface CdrInfo {
  comprobante: string
  tipo: TipoComprobante
  estado: EstadoComprobante
  codigo: string | null
  mensaje: string | null
  ticket: string | null
  cdr: string | null
  proveedor: string
  esLocal: boolean
  consultadoEn: string
}

export interface ComprobanteItemDetalle {
  id: string
  productoId: string | null
  descripcion: string
  cantidad: number
  valorUnitario: number
  precioUnitario: number
  igv: number
  total: number
  afectoIgv: boolean
}

export interface ComprobanteDetalle extends ComprobanteResumen {
  observacion: string | null
  items: ComprobanteItemDetalle[]
}

export interface PanelResumen {
  ventasMes: number
  comprobantesMes: number
  comprobantesPendientes: number
  clientesActivos: number
  ticketPromedio: number
  igvMes: number
  facturasMes: number
  boletasMes: number
  montoFacturasMes: number
  montoBoletasMes: number
  montoPendiente: number
  ventasPorMes: { mes: string; total: number; cantidad: number }[]
  ventasPorDia: { fecha: string; total: number; cantidad: number }[]
  ventasPorHora: { hora: string; total: number; cantidad: number }[]
  ultimos: ComprobanteResumen[]
}

export interface ConfiguracionSunat {
  empresa: {
    ruc: string
    razonSocial: string
    direccion: string
    ubigeo: string
    distrito: string
    provincia: string
    departamento: string
  }
  sunat: {
    proveedor: string
    modo: 'beta' | 'produccion' | 'local'
    endpoint: string
    configurado: boolean
    ruc: string
    certificadoConfigurado: boolean
    credencialesSolConfiguradas: boolean
    timeoutMs: number
  }
  gre: {
    modo: 'produccion' | 'desactivado'
    configurado: boolean
    tokenEndpoint: string
    apiBase: string
    timeoutMs: number
    intentos: number
    intervaloMs: number
  }
  resumenes: {
    envioReal: boolean
    modo: 'beta' | 'produccion' | 'local'
  }
  integraciones: {
    reniec: boolean
    almacenamiento: boolean
  }
  series: { tipo: TipoComprobante; serie: string; siguiente: number }[]
}

export type TipoVentaReporte = 'FACTURA' | 'BOLETA' | 'NOTA_CREDITO' | 'NOTA_DEBITO'

export interface RangoVentas {
  desde: string
  hasta: string
}

export interface DetalleVentaReporte {
  id: string
  tipo: TipoVentaReporte
  serie: string
  numero: number
  fecha: string
  cliente: string
  clienteDocumento: string
  moneda: string
  tipoCambio: number
  subtotal: number
  igv: number
  total: number
  totalPEN: number
  signo: 1 | -1
  estado: EstadoComprobante
  documentoAfectado: string | null
  motivoNota: string | null
}

export interface ReporteVentas {
  desde: string
  hasta: string
  generadoEn: string
  resumen: {
    comprobantes: number
    subtotal: number
    igv: number
    total: number
    totalPEN: number
    totalUSD: number
    ticketPromedio: number
    anulados: number
    facturas: number
    boletas: number
    notasCredito: number
    notasDebito: number
  }
  porDia: { fecha: string; comprobantes: number; totalPEN: number }[]
  porTipo: { tipo: TipoVentaReporte; comprobantes: number; totalPEN: number }[]
  porProducto: { descripcion: string; cantidad: number; totalPEN: number }[]
  detalle: DetalleVentaReporte[]
}

export type TipoDocumentoVenta = 'COTIZACION' | 'PEDIDO'
export type EstadoDocumentoVenta = 'PENDIENTE' | 'APROBADO' | 'RECHAZADO' | 'CONVERTIDO'

export interface ComprobanteReferencia {
  id: string
  tipo: TipoComprobante
  serie: string
  numero: number
}

export interface ItemDocumentoVenta {
  id: string
  /** Null en líneas escritas a mano, sin producto en el catálogo. */
  productoId: string | null
  descripcion: string
  cantidad: number
  valorUnitario: number
  precioUnitario: number
  igv: number
  total: number
  afectoIgv: boolean
}

export interface DocumentoVenta {
  id: string
  tipo: TipoDocumentoVenta
  serie: string
  numero: number
  fecha: string
  fechaVencimiento: string | null
  fechaEntrega: string | null
  clienteId: string
  cliente: string
  clienteDocumento: string
  clienteTipoDocumento: 'DNI' | 'RUC' | 'CE'
  clienteDireccion: string | null
  solicitadoPor: string | null
  subtotal: number
  igv: number
  total: number
  estado: EstadoDocumentoVenta
  observacion: string | null
  comprobante: ComprobanteReferencia | null
  creadoEn: string
  items: ItemDocumentoVenta[]
}

export type MotivoGuia = 'VENTA' | 'TRASLADO' | 'DEVOLUCION' | 'OTRO'
export type ModalidadGuia = 'PUBLICO' | 'PRIVADO'
export type EstadoGuia = 'EMITIDA' | 'ANULADA'
export type EstadoGuiaSunat = 'PENDIENTE' | 'ACEPTADO' | 'RECHAZADO' | 'ERROR_ENVIO'

export interface ItemGuiaRemision {
  id: string
  productoId: string
  descripcion: string
  cantidad: number
}

export interface GuiaRemision {
  id: string
  serie: string
  numero: number
  fechaEmision: string
  fechaTraslado: string
  clienteId: string
  cliente: string
  clienteDocumento: string
  clienteDireccion: string | null
  motivo: MotivoGuia
  modalidad: ModalidadGuia
  pesoKg: number | null
  direccionPartida: string
  direccionLlegada: string
  ubigeoPartida: string | null
  ubigeoLlegada: string | null
  placa: string | null
  conductor: string | null
  conductorDocumento: string | null
  conductorLicencia: string | null
  transportistaRuc: string | null
  transportistaRazonSocial: string | null
  transportistaRegistroMtc: string | null
  notas: string | null
  comprobante: ComprobanteReferencia | null
  estado: EstadoGuia
  estadoSunat: EstadoGuiaSunat | null
  sunatCodigo: string | null
  sunatMensaje: string | null
  sunatTicket: string | null
  tieneCdr: boolean
  enviadoEn: string | null
  motivoAnulacion: string | null
  anuladoEn: string | null
  creadoEn: string
  items: ItemGuiaRemision[]
}

export type TipoResumenSunat = 'RESUMEN_DIARIO' | 'COMUNICACION_BAJA'
export type EstadoResumenSunat = 'GENERADO' | 'PENDIENTE' | 'ACEPTADO' | 'RECHAZADO'

export interface ItemResumenSunat {
  id: string
  comprobanteId: string
  tipoDocumento: TipoComprobante
  serie: string
  numero: number
  numeroCompleto: string
  clienteDocumento: string
  fechaEmision: string
  subtotal: number
  igv: number
  total: number
  motivoBaja: string | null
}

export interface ResumenSunat {
  id: string
  tipo: TipoResumenSunat
  serie: string
  numero: number
  numeroCompleto: string
  fecha: string
  estado: EstadoResumenSunat
  codigoRespuesta: string | null
  mensajeRespuesta: string | null
  observacion: string | null
  sunatTicket: string | null
  archivoXmlKey: string | null
  archivoZipKey: string | null
  archivoCdrKey: string | null
  reenvios: number
  creadoEn: string
  actualizadoEn: string
  items: ItemResumenSunat[]
}

export interface RegistroAuditoria {
  id: string
  usuarioId: string | null
  usuario: string
  nombre: string | null
  modulo: string
  accion: string
  entidad: string
  entidadId: string | null
  metodo: string
  ruta: string
  estado: number
  direccionIp: string | null
  /** Texto JSON con solicitud, consulta y respuesta saneadas. */
  detalle: string | null
  creadoEn: string
}

export interface FiltrosAuditoria {
  usuario?: string
  modulo?: string
  accion?: string
  resultado?: 'OK' | 'ERROR'
  desde?: string
  hasta?: string
  limite?: number
  offset?: number
}

export interface RespuestaAuditoria {
  data: RegistroAuditoria[]
  pagination: { total: number; limit: number; offset: number }
}
