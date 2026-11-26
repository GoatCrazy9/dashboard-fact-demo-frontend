import { Icon } from '@/shared/ui/icons'
import type { Cliente } from '@/shared/types'

interface DetalleClienteDialogProps {
  cliente: Cliente
  onClose: () => void
}

function Dato({ label, valor }: { label: string; valor: string | null | undefined }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium text-tertiary">{label}</dt>
      <dd className="mt-0.5 break-words text-sm text-primary">{valor?.trim() || '—'}</dd>
    </div>
  )
}

export function DetalleClienteDialog({ cliente, onClose }: DetalleClienteDialogProps) {
  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-black/60 sm:items-center sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-detalle-cliente"
        className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-primary p-5 shadow-xl ring-1 ring-tertiary ring-inset sm:rounded-2xl sm:p-6"
      >
        <header className="mb-5 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 id="titulo-detalle-cliente" className="text-display-xs font-semibold text-primary">
              Detalle del cliente
            </h2>
            <p className="mt-1 truncate text-sm text-tertiary">{cliente.razonSocial}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-lg text-tertiary transition hover:bg-primary_hover hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            <Icon name="close" className="size-5" />
          </button>
        </header>

        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Dato label="Razón social / nombre" valor={cliente.razonSocial} />
          <Dato label="Documento" valor={`${cliente.tipoDocumento} ${cliente.numeroDocumento}`} />
          <Dato label="Dirección" valor={cliente.direccion} />
          <Dato label="Ubigeo" valor={cliente.ubigeo} />
          <Dato label="Teléfono" valor={cliente.telefono} />
          <Dato label="Correo electrónico" valor={cliente.email} />
        </dl>

        <footer className="mt-6 flex justify-end border-t border-tertiary pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-secondary bg-primary px-4 py-2 text-sm font-medium text-secondary hover:bg-secondary hover:text-primary"
          >
            Cerrar
          </button>
        </footer>
      </section>
    </div>
  )
}
