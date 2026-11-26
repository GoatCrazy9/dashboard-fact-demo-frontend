export interface CrearProductoInput {
  codigo: string
  descripcion: string
  unidad: string
  precioUnitario: number
  afectoIgv: boolean
  stock: number
}

export interface AjustarStockInput {
  tipo: 'ENTRADA' | 'SALIDA'
  cantidad: number
  motivo?: string
}
