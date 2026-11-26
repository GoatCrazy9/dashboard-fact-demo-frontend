import type { ReactNode } from 'react'
import { cn } from '@/shared/utils/cn'

/**
 * Envoltura para documentos A4 (cotizaciones, pedidos y guías). El CSS global
 * de impresión está pensado para tickets POS de 80 mm; este componente lo
 * sustituye solo mientras la vista A4 está montada.
 */
export function ImpresionA4({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <>
      <style>{'@media print { @page { size: A4; margin: 12mm; } }'}</style>
      <div className={cn('print-area print-a4', className)}>{children}</div>
    </>
  )
}

export function imprimirA4() {
  document.documentElement.dataset.print = 'a4'
  try {
    window.print()
  } finally {
    delete document.documentElement.dataset.print
  }
}
