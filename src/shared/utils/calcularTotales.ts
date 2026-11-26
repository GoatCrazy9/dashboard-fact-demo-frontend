import type { Producto } from '@/shared/types'

/**
 * Misma regla del backend: precios incluyen IGV y el redondeo se hace por línea
 * en centavos. Así el resumen de la pantalla coincide con lo que se guarda.
 */
export function calcularTotales(
  lineas: { productoId: string; cantidad: number }[],
  productos: Producto[],
) {
  let subtotalCentavos = 0
  let igvCentavos = 0
  let totalCentavos = 0

  for (const linea of lineas) {
    const producto = productos.find((item) => item.id === linea.productoId)
    if (!producto || linea.cantidad <= 0) continue
    const bruto = Math.round(Math.round(producto.precioUnitario * 100) * linea.cantidad)
    const base = producto.afectoIgv ? Math.round(bruto / 1.18) : bruto
    subtotalCentavos += base
    igvCentavos += bruto - base
    totalCentavos += bruto
  }

  return {
    subtotal: subtotalCentavos / 100,
    igv: igvCentavos / 100,
    total: totalCentavos / 100,
  }
}
