import { useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAsyncData } from '@/shared/hooks/useAsyncData'
import { calcularTotales } from '@/shared/utils/calcularTotales'
import { soles } from '@/shared/utils/format'
import { Alert } from '@/shared/ui/Alert'
import { Button } from '@/shared/ui/Button'
import { Card, CardHeader } from '@/shared/ui/Card'
import { Icon } from '@/shared/ui/icons'
import { PageHeader } from '@/shared/ui/PageHeader'
import { NuevoComprobanteSkeleton } from '@/shared/ui/PaginasSkeleton'
import { Select } from '@/shared/ui/Select'
import { clientesService } from '@/modules/clientes/service/clientesService'
import { productosService } from '@/modules/productos/service/productosService'
import { comprobantesService } from '../service/comprobantesService'

interface Linea {
  id: string
  productoId: string
  cantidad: number
}

const inputClass =
  'w-full rounded-lg border border-secondary bg-primary px-3 py-2 text-sm text-primary shadow-xs placeholder:text-placeholder focus:ring-2 focus:ring-brand focus:outline-none'

export function NuevoComprobantePage() {
  const navigate = useNavigate()
  const { data, error, loading } = useAsyncData(
    () => Promise.all([clientesService.listar(), productosService.listar()]),
    [],
  )
  const [clientes, productos] = data ?? [[], []]

  const [tipo, setTipo] = useState<'BOLETA' | 'FACTURA'>('BOLETA')
  const [clienteId, setClienteId] = useState('')
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10))
  const [lineas, setLineas] = useState<Linea[]>([
    { id: crypto.randomUUID(), productoId: '', cantidad: 1 },
  ])
  const [guardando, setGuardando] = useState(false)
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null)

  const totales = useMemo(() => calcularTotales(lineas, productos), [lineas, productos])

  const agregarLinea = () =>
    setLineas((actual) => [...actual, { id: crypto.randomUUID(), productoId: '', cantidad: 1 }])

  const quitarLinea = (id: string) =>
    setLineas((actual) => (actual.length === 1 ? actual : actual.filter((l) => l.id !== id)))

  const actualizarLinea = (id: string, cambio: Partial<Linea>) =>
    setLineas((actual) => actual.map((l) => (l.id === id ? { ...l, ...cambio } : l)))

  async function enviar(event: FormEvent) {
    event.preventDefault()
    setErrorEnvio(null)
    if (!clienteId) return setErrorEnvio('Selecciona un cliente.')
    const items = lineas.filter((l) => l.productoId && l.cantidad > 0)
    if (items.length === 0) return setErrorEnvio('Agrega al menos un producto.')

    setGuardando(true)
    try {
      await comprobantesService.crear({
        tipo,
        clienteId,
        fecha,
        items: items.map((l) => ({ productoId: l.productoId, cantidad: l.cantidad })),
      })
      navigate('/comprobantes')
    } catch (error) {
      setErrorEnvio((error as Error).message)
    } finally {
      setGuardando(false)
    }
  }

  if (loading) return <NuevoComprobanteSkeleton />

  return (
    <div className="w-full px-4 lg:px-8">
      <PageHeader
        title="Nuevo comprobante"
        description="Los montos se calculan en el servidor con precisión decimal antes de guardar."
        actions={
          <Link to="/comprobantes" className="text-sm font-medium text-tertiary hover:text-primary">
            Volver al listado
          </Link>
        }
      />

      {error && (
        <div className="mb-4">
          <Alert tone="error" title="No se pudieron cargar clientes y productos">
            {error.message}
          </Alert>
        </div>
      )}

      <form onSubmit={enviar} className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader title="Datos del comprobante" />
            <div className="grid gap-4 border-t border-tertiary p-4 sm:grid-cols-2 sm:p-6">
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-secondary">Tipo</span>
                <Select
                  ariaLabel="Tipo de comprobante"
                  value={tipo}
                  onChange={(valor) => setTipo(valor as 'BOLETA' | 'FACTURA')}
                  options={[
                    { value: 'BOLETA', label: 'Boleta electrónica' },
                    { value: 'FACTURA', label: 'Factura electrónica' },
                  ]}
                />
              </label>

              <label className="block text-sm">
                <span className="mb-1 block font-medium text-secondary">Fecha de emisión</span>
                <input
                  type="date"
                  value={fecha}
                  onChange={(event) => setFecha(event.target.value)}
                  className={inputClass}
                  required
                />
              </label>

              <label className="block text-sm sm:col-span-2">
                <span className="mb-1 block font-medium text-secondary">Cliente</span>
                <Select
                  ariaLabel="Cliente"
                  value={clienteId}
                  onChange={setClienteId}
                  placeholder="Seleccionar cliente…"
                  options={clientes.map((cliente) => ({
                    value: cliente.id,
                    label: `${cliente.numeroDocumento} — ${cliente.razonSocial}`,
                  }))}
                  isRequired
                  isDisabled={loading}
                />
                {tipo === 'FACTURA' && (
                  <span className="mt-1 block text-xs text-tertiary">
                    La factura exige un cliente con RUC.
                  </span>
                )}
              </label>
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Detalle"
              actions={
                <Button size="sm" variant="outline" onClick={agregarLinea} startIcon={<Icon name="plus" />}>
                  Agregar línea
                </Button>
              }
            />
            <div className="space-y-3 border-t border-tertiary p-4 sm:p-6">
              {lineas.map((linea, indice) => {
                const producto = productos.find((p) => p.id === linea.productoId)
                return (
                  <div key={linea.id} className="grid gap-2 sm:grid-cols-12 sm:items-end">
                    <label className="block text-sm sm:col-span-6">
                      <span className="mb-1 block text-xs font-medium text-tertiary">
                        Producto {indice + 1}
                      </span>
                      <Select
                        ariaLabel={`Producto ${indice + 1}`}
                        value={linea.productoId}
                        onChange={(valor) => actualizarLinea(linea.id, { productoId: valor })}
                        placeholder="Seleccionar…"
                        options={productos.map((p) => ({
                          value: p.id,
                          label: `${p.codigo} — ${p.descripcion} (${soles(p.precioUnitario)})`,
                        }))}
                        isRequired
                      />
                    </label>

                    <label className="block text-sm sm:col-span-2">
                      <span className="mb-1 block text-xs font-medium text-tertiary">Cantidad</span>
                      <input
                        type="number"
                        min={1}
                        step={1}
                        value={linea.cantidad}
                        onChange={(event) =>
                          actualizarLinea(linea.id, { cantidad: Number(event.target.value) })
                        }
                        className={inputClass}
                        required
                      />
                    </label>

                    <div className="text-sm sm:col-span-3">
                      <span className="mb-1 block text-xs font-medium text-tertiary">Importe</span>
                      <p className="py-2 font-medium text-primary">
                        {producto ? soles(producto.precioUnitario * linea.cantidad) : '—'}
                      </p>
                    </div>

                    <div className="sm:col-span-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => quitarLinea(linea.id)}
                        isDisabled={lineas.length === 1}
                        aria-label="Quitar línea"
                        startIcon={<Icon name="trash" />}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        </div>

        <div>
          <Card className="lg:sticky lg:top-20">
            <CardHeader title="Resumen" />
            <div className="space-y-3 border-t border-tertiary p-4 sm:p-6">
              <div className="flex justify-between text-sm">
                <span className="text-tertiary">Subtotal</span>
                <span className="text-secondary">{soles(totales.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-tertiary">IGV (18%)</span>
                <span className="text-secondary">{soles(totales.igv)}</span>
              </div>
              <div className="flex justify-between border-t border-tertiary pt-3 text-base font-semibold">
                <span className="text-primary">Total</span>
                <span className="text-primary">{soles(totales.total)}</span>
              </div>

              {errorEnvio && <Alert tone="error">{errorEnvio}</Alert>}

              <Button type="submit" fullWidth isLoading={guardando} startIcon={<Icon name="send" />}>
                Emitir comprobante
              </Button>
              <p className="text-xs text-tertiary">
                Se guarda como borrador y luego se envía al proveedor SUNAT configurado.
              </p>
            </div>
          </Card>
        </div>
      </form>
    </div>
  )
}
