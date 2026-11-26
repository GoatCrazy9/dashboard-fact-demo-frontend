export const soles = (value: number) =>
  new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(value)

const formatoFechaCorta = new Intl.DateTimeFormat('es-PE', {
  timeZone: 'UTC',
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

/**
 * Acepta fechas del backend ya completas (`2026-11-24T00:00:00.000Z`) y fechas
 * sueltas (`2026-11-24`). Nunca lanza: una fecha inválida se muestra como `—`.
 */
export const fechaCorta = (valor: string | null | undefined) => {
  if (!valor) return '—'
  const texto = String(valor)
  const iso = /^\d{4}-\d{2}-\d{2}$/.test(texto) ? `${texto}T00:00:00.000Z` : texto
  const fecha = new Date(iso)
  return Number.isNaN(fecha.getTime()) ? '—' : formatoFechaCorta.format(fecha)
}

export const numeroComprobante = (serie: string, numero: number) =>
  `${serie}-${String(numero).padStart(8, '0')}`
