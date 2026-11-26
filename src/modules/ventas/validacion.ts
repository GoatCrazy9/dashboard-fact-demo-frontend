import { validarDocumento, type TipoDocumentoConsulta } from '@/shared/integrations/reniec/reniec'

export interface FormularioVenta {
  tipoComprobante: 'BOLETA' | 'FACTURA'
  tipoDocumento: TipoDocumentoConsulta
  numeroDocumento: string
  nombreCliente: string
  telefono: string
  correo: string
  direccionCliente: string
  distrito: string
  provincia: string
  departamento: string
  ubigeo: string
  tipoCotizacion: string
  numeroGuia: string
  ordenCompra: string
  solicitadoPor: string
  fechaEntrega: string
  formaPago: string
  fechaPago: string
  condicionesPago: string
  moneda: 'PEN' | 'USD'
  tipoCambio: number
  detraccionCodigo: string
}

export interface FilaVenta {
  id: string
  productoId: string
  codigo: string
  descripcion: string
  unidad: string
  cantidad: number
  precioUnitario: number
  igv: number
}

export type Formulario = FormularioVenta
export type Fila = FilaVenta
export type ErroresVenta = Record<string, string>

const TIPOS_COTIZACION = ['COTIZACION', 'PEDIDO', 'VENTA']
const FORMAS_PAGO = ['EFECTIVO', 'TARJETA', 'TRANSFERENCIA', 'CHEQUE', 'CREDITO', 'OTRO']
const DOS_DECIMALES = (valor: number) => Math.abs(valor * 100 - Math.round(valor * 100)) < 1e-6

export function fechaEsValida(valor: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false
  const fecha = new Date(`${valor}T00:00:00Z`)
  return !Number.isNaN(fecha.getTime()) && fecha.toISOString().slice(0, 10) === valor
}

/** Todas las reglas del formulario de Ventas, en un solo lugar para reutilizarlas en el alta. */
export function validarVenta(form: FormularioVenta, filas: FilaVenta[]): ErroresVenta {
  const errores: ErroresVenta = {}
  const texto = (valor: string) => valor.trim()

  const tipoDocumento = form.tipoComprobante === 'FACTURA' ? 'ruc' : form.tipoDocumento
  const errorDocumento = validarDocumento(tipoDocumento, form.numeroDocumento)
  if (errorDocumento) errores.numeroDocumento = errorDocumento

  if (texto(form.nombreCliente).length < 2) errores.nombreCliente = 'El nombre del cliente es obligatorio.'
  else if (texto(form.nombreCliente).length > 200) errores.nombreCliente = 'Máximo 200 caracteres.'

  const telefono = texto(form.telefono)
  if (telefono && (!/^[+]?[\d\s()-]+$/.test(telefono) || telefono.replace(/\D/g, '').length < 7)) {
    errores.telefono = 'Ingresa un teléfono válido (mínimo 7 dígitos).'
  } else if (telefono.length > 30) {
    errores.telefono = 'Máximo 30 caracteres.'
  }

  const correo = texto(form.correo)
  if (correo && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(correo)) {
    errores.correo = 'Ingresa un correo electrónico válido.'
  } else if (correo.length > 120) {
    errores.correo = 'Máximo 120 caracteres.'
  }

  if (texto(form.direccionCliente).length > 300) errores.direccionCliente = 'Máximo 300 caracteres.'
  if (texto(form.distrito).length > 100) errores.distrito = 'Máximo 100 caracteres.'
  if (texto(form.provincia).length > 100) errores.provincia = 'Máximo 100 caracteres.'
  if (texto(form.departamento).length > 100) errores.departamento = 'Máximo 100 caracteres.'

  const ubigeo = texto(form.ubigeo)
  if (ubigeo && !/^\d{6}$/.test(ubigeo)) errores.ubigeo = 'El ubigeo tiene 6 dígitos.'

  if (!TIPOS_COTIZACION.includes(form.tipoCotizacion)) errores.tipoCotizacion = 'Selecciona un tipo válido.'
  if (texto(form.numeroGuia).length > 20) errores.numeroGuia = 'Máximo 20 caracteres.'
  if (texto(form.ordenCompra).length > 40) errores.ordenCompra = 'Máximo 40 caracteres.'
  if (texto(form.solicitadoPor).length > 100) errores.solicitadoPor = 'Máximo 100 caracteres.'

  const fechaEntrega = texto(form.fechaEntrega)
  if (fechaEntrega && !fechaEsValida(fechaEntrega)) errores.fechaEntrega = 'Usa el formato AAAA-MM-DD.'

  if (!FORMAS_PAGO.includes(form.formaPago)) errores.formaPago = 'Selecciona una forma de pago válida.'

  const fechaPago = texto(form.fechaPago)
  if (form.formaPago === 'CREDITO' && !fechaPago) errores.fechaPago = 'La forma de pago crédito requiere una fecha.'
  else if (fechaPago && !fechaEsValida(fechaPago)) errores.fechaPago = 'Usa el formato AAAA-MM-DD.'

  if (texto(form.condicionesPago).length > 100) errores.condicionesPago = 'Máximo 100 caracteres.'

  if (form.moneda !== 'PEN' && form.moneda !== 'USD') errores.moneda = 'Selecciona PEN o USD.'
  if (form.moneda === 'PEN' && form.tipoCambio !== 1) {
    errores.tipoCambio = 'En soles el tipo de cambio debe ser 1.'
  }
  if (form.moneda === 'USD' && (!Number.isFinite(form.tipoCambio) || form.tipoCambio <= 0 || form.tipoCambio > 1000)) {
    errores.tipoCambio = 'En dólares el tipo de cambio debe estar entre 0 y 1000.'
  }

  if (!/^\d{3}$/.test(form.detraccionCodigo)) {
    errores.detraccionCodigo = 'Selecciona un código de detracción válido.'
  }

  if (filas.length === 0) {
    errores.items = 'Agrega al menos un ítem.'
    return errores
  }
  if (filas.length > 100) errores.items = 'Máximo 100 ítems por comprobante.'

  let total = 0
  filas.forEach((fila) => {
    const prefijo = `item.${fila.id}`
    if (!texto(fila.codigo)) errores[`${prefijo}.codigo`] = 'El código es obligatorio.'
    else if (texto(fila.codigo).length > 40) errores[`${prefijo}.codigo`] = 'Máximo 40 caracteres.'

    if (texto(fila.descripcion).length < 2) errores[`${prefijo}.descripcion`] = 'La descripción es obligatoria.'
    else if (texto(fila.descripcion).length > 300) errores[`${prefijo}.descripcion`] = 'Máximo 300 caracteres.'

    if (!texto(fila.unidad)) errores[`${prefijo}.unidad`] = 'La unidad es obligatoria.'
    else if (texto(fila.unidad).length > 10) errores[`${prefijo}.unidad`] = 'Máximo 10 caracteres.'

    if (!Number.isFinite(fila.cantidad) || fila.cantidad <= 0 || fila.cantidad > 100_000) {
      errores[`${prefijo}.cantidad`] = 'La cantidad debe estar entre 0.01 y 100000.'
    } else if (!DOS_DECIMALES(fila.cantidad)) {
      errores[`${prefijo}.cantidad`] = 'Máximo 2 decimales.'
    }

    if (!Number.isFinite(fila.precioUnitario) || fila.precioUnitario <= 0 || fila.precioUnitario > 1_000_000_000) {
      errores[`${prefijo}.precioUnitario`] = 'El precio unitario debe ser mayor a 0.'
    } else if (!DOS_DECIMALES(fila.precioUnitario)) {
      errores[`${prefijo}.precioUnitario`] = 'Máximo 2 decimales.'
    }

    if (!Number.isFinite(fila.igv) || fila.igv < 0 || fila.igv > 100) {
      errores[`${prefijo}.igv`] = 'El IGV debe estar entre 0 y 100.'
    }

    if (Number.isFinite(fila.cantidad) && Number.isFinite(fila.precioUnitario)) {
      total += fila.cantidad * fila.precioUnitario
    }
  })

  if (total > 1_000_000_000) errores.items = 'El importe total supera el límite permitido.'

  return errores
}
