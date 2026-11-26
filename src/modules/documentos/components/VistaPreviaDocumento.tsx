import { Button } from '@/shared/ui/Button'
import { Icon } from '@/shared/ui/icons'
import type { TipoDocumentoVenta } from '@/shared/types'
import { TicketDocumento, type ItemTicket } from './TicketDocumento'

export type ItemVistaPrevia = ItemTicket

interface VistaPreviaDocumentoProps {
  tipo: TipoDocumentoVenta
  empresa: { razonSocial: string; ruc: string; direccion: string }
  cliente: { razonSocial: string; numeroDocumento: string; direccion: string | null }
  fecha: string
  fechaVencimiento: string
  fechaEntrega: string
  solicitadoPor: string
  observacion: string
  items: ItemVistaPrevia[]
  subtotal: number
  igv: number
  total: number
  onClose: () => void
}

/** Vista previa en POS 80 del documento aún no guardado. */
export function VistaPreviaDocumento({
  onClose,
  ...ticket
}: VistaPreviaDocumentoProps) {
  return (
    <div
      className="overlay-vista-previa fixed inset-0 z-[60] overflow-y-auto bg-black/60 p-2 sm:p-4"
      onMouseDown={(evento) => {
        if (evento.target === evento.currentTarget) onClose()
      }}
    >
      <div className="mx-auto w-full max-w-[80mm]">
        <div className="no-print mb-3 flex flex-wrap justify-end gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.print()}
            startIcon={<Icon name="file-text" />}
          >
            Imprimir / guardar PDF
          </Button>
          <Button size="sm" variant="ghost" onClick={onClose} startIcon={<Icon name="close" />}>
            Cerrar
          </Button>
        </div>

        <TicketDocumento {...ticket} />
      </div>
    </div>
  )
}
