export const MODULOS_AUDITORIA = [
  'Sesión',
  'Ventas',
  'Comprobantes',
  'Proformas y pedidos',
  'Guías de remisión',
  'Resúmenes y bajas',
  'Clientes',
  'Productos',
  'Usuarios y accesos',
  'Configuración',
  'Reportes',
  'Sistema',
]

export const ACCIONES_AUDITORIA = [
  'Crear',
  'Actualizar',
  'Eliminar',
  'Anular',
  'Cambiar estado',
  'Convertir',
  'Emitir',
  'Emitir nota',
  'Generar diario',
  'Generar bajas',
  'Iniciar sesión',
  'Cerrar sesión',
  'Inicio fallido',
  'Inicio bloqueado',
  'Inicio inactivo',
  'Cuenta bloqueada',
]

type Tono = 'success' | 'error' | 'warning' | 'brand' | 'gray'

/** Fecha y hora en Lima; tolera fechas de calendario y ISO del backend. */
export function formatearFechaHora(valor: string | null | undefined): string {
  if (!valor) return '—'
  const calendario = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valor)
  if (calendario) return `${calendario[3]}/${calendario[2]}/${calendario[1]}`

  const fecha = new Date(valor)
  if (Number.isNaN(fecha.getTime())) return valor
  const partes = Object.fromEntries(
    new Intl.DateTimeFormat('es-PE', {
      timeZone: 'America/Lima',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(fecha)
      .map(({ type, value }) => [type, value]),
  )
  return `${partes.day}/${partes.month}/${partes.year} ${partes.hour}:${partes.minute}`
}

export function tonoAccion(accion: string): Tono {
  if (/anular|eliminar|bloquead|fallido|inactivo|rechazar/.test(accion)) return 'error'
  if (/crear|convertir|iniciar sesión|aprobar|reenviar/.test(accion)) return 'success'
  if (/cambiar|actualizar|nota|cerrar/.test(accion)) return 'warning'
  return 'brand'
}

export function tonoResultado(estado: number): Tono {
  return estado >= 200 && estado < 400 ? 'success' : 'error'
}

/** El backend guarda el detalle como texto JSON; lo deja legible sin perder el original. */
export function formatearDetalle(valor: string | null | undefined): string | null {
  if (!valor) return null
  try {
    return JSON.stringify(JSON.parse(valor), null, 2)
  } catch {
    return valor
  }
}
