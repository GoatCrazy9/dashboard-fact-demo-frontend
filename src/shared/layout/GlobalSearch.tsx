import { useEffect, useMemo, useRef, useState, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { clientesService } from '@/modules/clientes/service/clientesService'
import { comprobantesService } from '@/modules/comprobantes/service/comprobantesService'
import { productosService } from '@/modules/productos/service/productosService'
import { useFuentesDatos } from '@/shared/hooks/useFuentesDatos'
import { Icon, type IconName } from '@/shared/ui/icons'
import { ResultadosBusquedaSkeleton } from '@/shared/ui/PaginasSkeleton'
import { cn } from '@/shared/utils/cn'
import { fechaCorta, numeroComprobante, soles } from '@/shared/utils/format'

interface Resultado {
  id: string
  tipo: string
  icono: IconName
  titulo: string
  subtitulo: string
  path: string
}

interface Fuente {
  icono: IconName
  fetch: () => Promise<Resultado[]>
}

/** Adaptación del GlobalSearch histórico de dojo a las tres entidades de SICAP. */
const FUENTES: Record<'comprobantes' | 'clientes' | 'productos', Fuente> = {
  comprobantes: {
    icono: 'receipt',
    fetch: async () =>
      (await comprobantesService.listar()).map((comprobante) => ({
        id: comprobante.id,
        tipo: 'Comprobante',
        icono: 'receipt' as IconName,
        titulo: numeroComprobante(comprobante.serie, comprobante.numero),
        subtitulo: `${comprobante.cliente} · ${fechaCorta(comprobante.fecha)}`,
        path: `/comprobantes/${comprobante.id}`,
      })),
  },
  clientes: {
    icono: 'users',
    fetch: async () =>
      (await clientesService.listar()).map((cliente) => ({
        id: cliente.id,
        tipo: 'Cliente',
        icono: 'users' as IconName,
        titulo: cliente.razonSocial,
        subtitulo: `${cliente.tipoDocumento} ${cliente.numeroDocumento}`,
        path: `/clientes?q=${encodeURIComponent(cliente.numeroDocumento)}`,
      })),
  },
  productos: {
    icono: 'tag',
    fetch: async () =>
      (await productosService.listar()).map((producto) => ({
        id: producto.id,
        tipo: 'Producto',
        icono: 'tag' as IconName,
        titulo: producto.descripcion,
        subtitulo: `${producto.codigo} · ${soles(producto.precioUnitario)}`,
        path: `/productos?q=${encodeURIComponent(producto.codigo)}`,
      })),
  },
}

type DatosGlobales = Record<keyof typeof FUENTES, Resultado[]>

const FETCHERS = Object.fromEntries(
  Object.entries(FUENTES).map(([clave, fuente]) => [clave, fuente.fetch]),
) as { [K in keyof DatosGlobales]: () => Promise<Resultado[]> }

function BuscadorInput({
  valor,
  onChange,
  onFocus,
  inputRef,
  movil = false,
}: {
  valor: string
  onChange: (valor: string) => void
  onFocus: () => void
  inputRef: RefObject<HTMLInputElement | null>
  movil?: boolean
}) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute inset-y-0 start-4 flex items-center">
        <Icon name="search" className="size-5 text-fg-tertiary" />
      </span>
      <input
        ref={inputRef}
        type="search"
        value={valor}
        onChange={(event) => onChange(event.target.value)}
        onFocus={onFocus}
        placeholder="Buscar comprobante, cliente o producto…"
        aria-label="Búsqueda global"
        className={cn(
          'w-full rounded-lg bg-primary text-primary shadow-xs ring-1 ring-primary ring-inset transition-shadow placeholder:text-placeholder focus:ring-2 focus:ring-brand focus:outline-hidden',
          movil ? 'h-12 ps-12 pe-3 text-base' : 'h-11 py-2.5 ps-12 pe-14 text-sm',
        )}
      />
      {!movil && (
        <span className="pointer-events-none absolute inset-y-0 end-2.5 my-auto inline-flex h-6 items-center rounded-lg bg-secondary px-1.75 text-xs tracking-[-0.2px] text-tertiary ring-1 ring-tertiary ring-inset">
          ⌘ K
        </span>
      )}
    </div>
  )
}

function ListaResultados({
  resultados,
  cargando,
  conError,
  consulta,
  onElegir,
  className,
}: {
  resultados: Resultado[]
  cargando: boolean
  conError: boolean
  consulta: string
  onElegir: (path: string) => void
  className?: string
}) {
  return (
    <div
      className={cn(
        'rounded-xl bg-primary p-2 shadow-lg ring-1 ring-tertiary ring-inset',
        className,
      )}
    >
      {cargando ? (
        <ResultadosBusquedaSkeleton />
      ) : conError && resultados.length === 0 ? (
        <p className="px-3 py-6 text-center text-sm text-error-primary">
          No se pudieron cargar los datos.
        </p>
      ) : resultados.length === 0 ? (
        <p className="px-3 py-6 text-center text-sm text-tertiary">
          {consulta.trim() ? 'Sin resultados.' : 'Escribe para buscar.'}
        </p>
      ) : (
        <ul className="space-y-0.5">
          {resultados.map((resultado) => (
            <li key={`${resultado.tipo}-${resultado.id}`}>
              <button
                type="button"
                onClick={() => onElegir(resultado.path)}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-start transition-colors hover:bg-primary_hover"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-tertiary">
                  <Icon name={resultado.icono} className="size-5 text-primary" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-primary">
                    {resultado.titulo}
                  </span>
                  <span className="block truncate text-xs text-tertiary">
                    {resultado.subtitulo || resultado.tipo}
                  </span>
                </span>
                <span className="shrink-0 rounded-md bg-tertiary px-1.5 py-0.5 text-[10px] font-medium uppercase text-tertiary">
                  {resultado.tipo}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function GlobalSearch() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const inlineRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const buttonMovilRef = useRef<HTMLButtonElement>(null)
  const inputInlineRef = useRef<HTMLInputElement>(null)
  const inputMovilRef = useRef<HTMLInputElement>(null)
  const { datos, cargando, fuentesConError } = useFuentesDatos<DatosGlobales>(FETCHERS)

  const resultados = useMemo(() => {
    const texto = query.trim().toLowerCase()
    if (!texto) return []
    const todos: Resultado[] = []
    for (const lista of Object.values(datos)) todos.push(...(lista ?? []))
    return todos
      .filter(
        (resultado) =>
          resultado.titulo.toLowerCase().includes(texto) ||
          resultado.subtitulo.toLowerCase().includes(texto),
      )
      .slice(0, 20)
  }, [query, datos])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setOpen((abierto) => !abierto)
      }
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    if (!open) return

    function handleClickOutside(event: MouseEvent) {
      const objetivo = event.target as Node
      if (
        inlineRef.current?.contains(objetivo) ||
        overlayRef.current?.contains(objetivo) ||
        buttonMovilRef.current?.contains(objetivo)
      )
        return
      setOpen(false)
    }

    document.addEventListener('mousedown', handleClickOutside)
    const frame = requestAnimationFrame(() => {
      const input = window.matchMedia('(min-width: 1280px)').matches
        ? inputInlineRef.current
        : inputMovilRef.current
      input?.focus()
    })
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      cancelAnimationFrame(frame)
    }
  }, [open])

  function irAResultado(path: string) {
    setOpen(false)
    setQuery('')
    navigate(path)
  }

  const propsInput = {
    valor: query,
    onChange: (valor: string) => {
      setQuery(valor)
      setOpen(true)
    },
    onFocus: () => setOpen(true),
  }

  return (
    <>
      <div ref={inlineRef} className="hidden w-72 xl:block 2xl:w-96">
        <div className="relative">
          <BuscadorInput {...propsInput} inputRef={inputInlineRef} />
          {open && (
            <ListaResultados
              resultados={resultados}
              cargando={cargando}
              conError={fuentesConError.length > 0}
              consulta={query}
              onElegir={irAResultado}
              className="absolute start-0 end-0 top-full z-50 mt-2 max-h-96 overflow-y-auto"
            />
          )}
        </div>
      </div>

      <button
        ref={buttonMovilRef}
        type="button"
        onClick={() => setOpen((abierto) => !abierto)}
        aria-label={open ? 'Cerrar búsqueda global' : 'Abrir búsqueda global'}
        aria-expanded={open}
        className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-lg text-secondary outline-focus-ring transition-colors hover:text-primary xl:hidden"
      >
        <Icon name="search" className="size-5" />
      </button>

      {open &&
        createPortal(
          <div ref={overlayRef} className="fixed inset-0 z-[60] xl:hidden">
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setOpen(false)}
              aria-hidden="true"
            />
            <div className="relative mx-3 mt-3 rounded-xl bg-primary p-3 shadow-xl ring-1 ring-tertiary ring-inset">
              <BuscadorInput {...propsInput} inputRef={inputMovilRef} movil />
              <ListaResultados
                resultados={resultados}
                cargando={cargando}
                conError={fuentesConError.length > 0}
                consulta={query}
                onElegir={irAResultado}
                className="mt-2 max-h-[65dvh] overflow-y-auto shadow-none ring-0"
              />
            </div>
          </div>,
          document.body,
        )}
    </>
  )
}
