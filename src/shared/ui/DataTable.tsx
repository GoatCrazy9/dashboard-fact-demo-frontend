import { useId, useState, type ReactNode } from 'react'
import { Card, CardBody } from './Card'
import { Icon } from './icons'
import { Button } from './Button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/shared/utils/cn'
import { Skeleton } from './Skeleton'
import { Select } from './Select'

export interface Column<Row> {
  key: string
  header: string
  render: (row: Row) => ReactNode
  cellClassName?: string
  /** Alineación del encabezado; útil cuando la celda va a la derecha. */
  headerClassName?: string
  /** Si true, esta columna se oculta en el layout 'cards' móvil. */
  hideOnMobileCards?: boolean
  /** Si true, esta columna son acciones (botones) y se renderiza en sección aparte en cards. */
  isActions?: boolean
  sortValue?: (row: Row) => string | number
}

type MobileLayout = 'table' | 'cards'

/** Densidad del listado: 'compact' reduce tipografía y espaciado de las filas. */
type Density = 'default' | 'compact'

interface DataTableProps<Row> {
  columns: Column<Row>[]
  rows: Row[]
  rowKey: (row: Row) => string
  emptyTitle: string
  emptyDescription?: string
  /** Layout en móvil: 'table' = scroll horizontal, 'cards' = tarjetas apiladas. Por defecto 'table'. */
  mobileLayout?: MobileLayout
  /** Activa paginación local. Si se indica `onPageSizeChange`, el selector "Por página" aparece en el pie. */
  pagination?: {
    pageSize?: number
    /** Cantidades ofrecidas en el selector "Por página" del pie. */
    pageSizeOptions?: readonly number[]
    /** Habilita el selector "Por página" en el pie; el listado controla el valor. */
    onPageSizeChange?: (pageSize: number) => void
  }
  /** Conserva la página y reemplaza solo las filas mientras se actualizan los datos. */
  loading?: boolean
  /** Apariencia compacta con filas alternadas, limitada a esta tabla. */
  rowStyle?: 'default' | 'striped'
  /** Muestra más filas por pantalla con textos y espacios más pequeños. Por defecto 'default'. */
  density?: Density
}

export function DataTable<Row>({
  columns,
  rows,
  rowKey,
  emptyTitle,
  emptyDescription,
  mobileLayout = 'table',
  pagination,
  loading = false,
  rowStyle = 'default',
  density = 'default',
}: DataTableProps<Row>) {
  const compact = density === 'compact'
  const [page, setPage] = useState(0)
  const [sort, setSort] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null)
  const pageSize = pagination?.pageSize ?? 20
  // Al cambiar la cantidad por página se vuelve a la primera.
  const [lastPageSize, setLastPageSize] = useState(pageSize)
  if (lastPageSize !== pageSize) {
    setLastPageSize(pageSize)
    setPage(0)
  }
  // Al cambiar las filas por filtros, vuelve a la primera página.
  const firmaFilas = rows.map(rowKey).join('|')
  const [ultimaFirma, setUltimaFirma] = useState(firmaFilas)
  if (ultimaFirma !== firmaFilas) {
    setUltimaFirma(firmaFilas)
    setPage(0)
  }
  const sortedRows = sort ? [...rows].sort((a, b) => {
    const column = columns.find((item) => item.key === sort.key)
    if (!column?.sortValue) return 0
    const left = column.sortValue(a)
    const right = column.sortValue(b)
    const result = typeof left === 'number' && typeof right === 'number'
      ? left - right
      : String(left).localeCompare(String(right), 'es', { numeric: true, sensitivity: 'base' })
    return sort.direction === 'asc' ? result : -result
  }) : rows
  const pageCount = Math.ceil(sortedRows.length / pageSize)
  const currentPage = Math.min(page, Math.max(0, pageCount - 1))
  const visibleRows = pagination
    ? sortedRows.slice(currentPage * pageSize, (currentPage + 1) * pageSize)
    : sortedRows

  if (rows.length === 0 && !loading) {
    return (
      <>
        <div className={cn('text-center', compact ? 'py-8' : 'py-12')}>
          <Icon name="clipboard" className={cn('mx-auto text-fg-tertiary', compact ? 'size-10' : 'size-12')} />
          <p className="mt-3 text-sm font-medium text-primary">{emptyTitle}</p>
          {emptyDescription && <p className="mt-1 text-sm text-tertiary">{emptyDescription}</p>}
        </div>
        {pagination && (
          <TablePagination
            total={rows.length}
            page={0}
            pageCount={0}
            pageSize={pageSize}
            pageSizeOptions={pagination.pageSizeOptions}
            onPageSizeChange={pagination.onPageSizeChange}
            onPageChange={setPage}
            compact={compact}
          />
        )}
      </>
    )
  }

  const dataColumns = columns.filter((c) => !c.hideOnMobileCards && !c.isActions)
  const actionColumns = columns.filter((c) => c.isActions)

  // Layout 'cards' para móvil + tabla para desktop
  if (mobileLayout === 'cards') {
    return (
      <>
        {/* Cards en móvil (<lg) */}
        <div className={cn('lg:hidden', compact ? 'space-y-2' : 'space-y-3')}>
          {loading ? <SkeletonCardRows columns={dataColumns.length + (actionColumns.length ? 1 : 0)} compact={compact} /> : visibleRows.map((row) => (
            <Card key={rowKey(row)} className="ring-1 ring-tertiary">
              <CardBody className={cn(compact ? 'space-y-1.5 p-3' : 'space-y-2 p-4')}>
                {dataColumns.map((column) => (
                  <div key={column.key} className={cn('flex flex-col sm:flex-row items-start sm:items-center', compact ? 'gap-1' : 'gap-2')}>
                    <dt className={cn('w-full shrink-0 font-medium text-tertiary sm:w-28', compact ? 'text-[11px] sm:w-24' : 'text-xs')}>
                      {column.header}
                    </dt>
                    <dd className={cn('flex-1 text-primary', compact ? 'text-xs' : 'text-sm', column.cellClassName)}>
                      {column.render(row)}
                    </dd>
                  </div>
                ))}
                {actionColumns.length > 0 && (
                  <div className={cn('flex flex-wrap border-t border-tertiary', compact ? 'gap-1.5 pt-1.5' : 'gap-2 pt-2')}>
                    {actionColumns.map((column) => (
                      <div key={column.key} className="flex-1 min-w-[120px]">
                        {column.render(row)}
                      </div>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>
          ))}
        </div>
        {/* Tabla en desktop (≥lg) */}
        <div className="hidden lg:block overflow-x-auto">
          <table className={cn('min-w-full', rowStyle === 'striped' && '[&_tbody_tr:nth-child(odd)]:bg-row_alt [&_tbody_tr]:border-b [&_tbody_tr]:border-tertiary/50')}>
            <thead className={cn('border-y border-tertiary', rowStyle === 'striped' && 'h-11 bg-primary', compact && 'h-9')}>
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    scope="col"
                    className={cn('py-3 text-start text-xs font-medium text-tertiary', rowStyle === 'striped' && 'px-4 py-2 text-xs font-semibold', compact && 'px-2.5 py-1 text-[11px] font-medium', column.headerClassName)}
                  >
                    {column.sortValue ? <div className={cn('flex items-center gap-1', column.headerClassName)}><button type="button" className="inline-flex items-center gap-1 hover:text-primary" onClick={() => { setSort({ key: column.key, direction: sort?.key === column.key && sort.direction === 'asc' ? 'desc' : 'asc' }); setPage(0) }} aria-label={`Ordenar por ${column.header} ${sort?.key === column.key && sort.direction === 'asc' ? 'descendente' : 'ascendente'}`}>
                      {column.header}<span aria-hidden="true" className="text-tertiary">{sort?.key === column.key ? (sort.direction === 'asc' ? '↑' : '↓') : '↕'}</span>
                    </button></div> : column.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? <SkeletonRows columns={columns.length} striped={rowStyle === 'striped'} compact={compact} /> : visibleRows.map((row) => (
                <tr key={rowKey(row)} className={cn('border-t border-tertiary/50', rowStyle === 'striped' && 'h-[72px] transition-colors hover:bg-secondary_hover', compact && 'h-auto')}>
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={cn('py-3 text-sm text-tertiary', rowStyle === 'striped' && 'px-4 py-4', compact && 'px-2.5 py-1.5 text-xs', column.cellClassName)}
                    >
                      {column.render(row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {pagination && (
          <TablePagination
            total={rows.length}
            page={currentPage}
            pageCount={pageCount}
            pageSize={pageSize}
            pageSizeOptions={pagination.pageSizeOptions}
            onPageSizeChange={pagination.onPageSizeChange}
            onPageChange={setPage}
            compact={compact}
          />
        )}
      </>
    )
  }

  // Layout 'table' (por defecto): tabla con scroll horizontal
  return (
    <div className="overflow-x-auto">
      <table className={cn('min-w-full', rowStyle === 'striped' && '[&_tbody_tr:nth-child(odd)]:bg-row_alt [&_tbody_tr]:border-b [&_tbody_tr]:border-tertiary/50')}>
        <thead className={cn('border-y border-tertiary', rowStyle === 'striped' && 'h-11 bg-primary', compact && 'h-9')}>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={cn('py-3 text-start text-xs font-medium text-tertiary', rowStyle === 'striped' && 'px-4 py-2 text-xs font-semibold', compact && 'px-2.5 py-1 text-[11px] font-medium', column.headerClassName)}
              >
                {column.sortValue ? <div className={cn('flex items-center gap-1', column.headerClassName)}><button type="button" className="inline-flex items-center gap-1 hover:text-primary" onClick={() => { setSort({ key: column.key, direction: sort?.key === column.key && sort.direction === 'asc' ? 'desc' : 'asc' }); setPage(0) }} aria-label={`Ordenar por ${column.header} ${sort?.key === column.key && sort.direction === 'asc' ? 'descendente' : 'ascendente'}`}>
                  {column.header}<span aria-hidden="true" className="text-tertiary">{sort?.key === column.key ? (sort.direction === 'asc' ? '↑' : '↓') : '↕'}</span>
                </button></div> : column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
        {loading ? <SkeletonRows columns={columns.length} striped={rowStyle === 'striped'} compact={compact} /> : visibleRows.map((row) => (
            <tr key={rowKey(row)} className={cn('border-t border-tertiary/50', rowStyle === 'striped' && 'h-[72px] transition-colors hover:bg-secondary_hover', compact && 'h-auto')}>
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={cn('py-3 text-sm text-tertiary', rowStyle === 'striped' && 'px-4 py-4', compact && 'px-2.5 py-1.5 text-xs', column.cellClassName)}
                >
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {pagination && (
        <TablePagination
          total={rows.length}
          page={currentPage}
          pageCount={pageCount}
          pageSize={pageSize}
          pageSizeOptions={pagination.pageSizeOptions}
          onPageSizeChange={pagination.onPageSizeChange}
          onPageChange={setPage}
          compact={compact}
        />
      )}
    </div>
  )
}

function SkeletonRows({ columns, striped = false, compact = false }: { columns: number; striped?: boolean; compact?: boolean }) {
  return (
    <>
      <tr role="status">
        <td colSpan={columns} className="sr-only">Cargando registros…</td>
      </tr>
      {Array.from({ length: 4 }, (_, row) => (
        <tr key={row} aria-hidden="true" className={cn('border-t border-tertiary/50', striped && 'h-[72px] [&:nth-child(odd)]:bg-row_alt', compact && 'h-11')}>
          {Array.from({ length: columns }, (_, col) => (
            <td key={col} className={cn('py-4', striped && 'px-4', compact && 'px-2.5 py-1.5')}>
              {striped && col === columns - 1
                ? <Skeleton className={cn('ml-auto rounded-lg', compact ? 'h-7 w-20' : 'h-9 w-24')} />
                : <Skeleton className={cn(compact ? 'h-3' : 'h-4', skeletonWidths[(row + col) % skeletonWidths.length])} />}
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}

const skeletonWidths = ['w-2/3', 'w-4/5', 'w-full', 'w-1/2']

function SkeletonCardRows({ columns, compact = false }: { columns: number; compact?: boolean }) {
  return (
    <div role="status" aria-label="Cargando registros" className={cn(compact ? 'space-y-2' : 'space-y-3')}>
      <span className="sr-only">Cargando registros…</span>
      {Array.from({ length: 4 }, (_, row) => (
        <Card key={row} className="ring-1 ring-tertiary">
          <CardBody className={cn('grid grid-cols-[minmax(4.5rem,0.7fr)_minmax(0,2fr)] items-center gap-x-4', compact ? 'gap-y-2 p-3' : 'gap-y-3 p-4')}>
            {Array.from({ length: Math.min(columns, 4) }, (_, col) => (
              <div key={col} className="contents">
                <Skeleton className={cn(compact ? 'h-2.5' : 'h-3', 'w-4/5')} />
                <Skeleton className={cn(compact ? 'h-3' : 'h-4', skeletonWidths[(row + col) % skeletonWidths.length])} />
              </div>
            ))}
          </CardBody>
        </Card>
      ))}
    </div>
  )
}

/** Cantidades por página que ofrecen los listados. */
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const

export interface TablePaginationProps {
  /** Total de filas del listado. En paginación de servidor es el total global. */
  total: number
  /** Página actual (0-based). */
  page: number
  /** Total de páginas. */
  pageCount: number
  /** Filas por página. */
  pageSize: number
  /** Cantidades disponibles en el selector "Por página". */
  pageSizeOptions?: readonly number[]
  /**
   * Si se indica, se muestra el selector "Por página" junto al resumen
   * "Mostrando…". Al cambiar el valor, el listado debe volver a la primera página.
   */
  onPageSizeChange?: (pageSize: number) => void
  onPageChange: (page: number) => void
  /** Reduce textos y botones, para listados con `density="compact"`. */
  compact?: boolean
}

/**
 * Pie de paginación reutilizable: resumen "Mostrando X–Y de N", selector opcional
 * de cantidad por página y navegación anterior/siguiente. Úsalo también en listados
 * paginados en el servidor calculando `page` a partir del offset.
 */
export function TablePagination({
  total,
  page,
  pageCount,
  pageSize,
  pageSizeOptions = PAGE_SIZE_OPTIONS,
  onPageSizeChange,
  onPageChange,
  compact = false,
}: TablePaginationProps) {
  const id = useId()
  const from = total === 0 ? 0 : page * pageSize + 1
  const to = Math.min((page + 1) * pageSize, total)
  const size = compact ? 'xs' : 'sm'
  const iconClass = compact ? 'size-3.5' : 'size-4'

  return (
    <div className={cn('flex flex-wrap items-center justify-between border-t border-tertiary text-tertiary', compact ? 'gap-2 pt-2.5 text-xs' : 'gap-3 pt-4 text-sm')}>
      <div className={cn('flex flex-wrap items-center', compact ? 'gap-x-3 gap-y-1.5' : 'gap-x-4 gap-y-2')}>
        <span>
          Mostrando {from}–{to} de {total}
        </span>
        {onPageSizeChange && (
          <label htmlFor={id} className="flex items-center gap-1.5">
            <span className="whitespace-nowrap">Por página</span>
            <Select
              id={id}
              ariaLabel="Por página"
              value={String(pageSize)}
              onChange={(valor) => onPageSizeChange(Number(valor))}
              options={pageSizeOptions.map((option) => ({
                value: String(option),
                label: String(option),
              }))}
              size="sm"
              wrapperClassName="w-auto"
              className="w-14"
            />
          </label>
        )}
      </div>
      <div className={cn('flex', compact ? 'gap-1.5' : 'gap-2')}>
        <Button variant="outline" size={size} isDisabled={page <= 0} onPress={() => onPageChange(page - 1)} startIcon={<Icon icon={ChevronLeft} className={iconClass} />}>Anterior</Button>
        <Button variant="outline" size={size} isDisabled={page >= pageCount - 1} onPress={() => onPageChange(page + 1)} endIcon={<Icon icon={ChevronRight} className={iconClass} />}>Siguiente</Button>
      </div>
    </div>
  )
}
