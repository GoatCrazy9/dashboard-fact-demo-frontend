import type { ReactNode } from 'react'
import { useAsyncData } from '@/shared/hooks/useAsyncData'
import { Alert } from '@/shared/ui/Alert'
import { Badge } from '@/shared/ui/Badge'
import { Card, CardHeader } from '@/shared/ui/Card'
import { Icon } from '@/shared/ui/icons'
import { PageHeader } from '@/shared/ui/PageHeader'
import { ConfiguracionSkeleton } from '@/shared/ui/PaginasSkeleton'
import type { ConfiguracionSunat, TipoComprobante } from '@/shared/types'
import { cn } from '@/shared/utils/cn'
import { configuracionService } from '../service/configuracionService'

type TonoBadge = 'brand' | 'success' | 'error' | 'warning' | 'gray'

const ETIQUETAS_SERIE: Record<TipoComprobante, string> = {
  FACTURA: 'Factura',
  BOLETA: 'Boleta',
  NOTA_CREDITO: 'Nota de crédito',
  NOTA_DEBITO: 'Nota de débito',
  GUIA_REMISION: 'Guía de remisión',
}

const consecutivo = (numero: number) => String(numero).padStart(8, '0')

function Dato({
  etiqueta,
  valor,
  monoespacio = false,
}: {
  etiqueta: string
  valor: ReactNode
  monoespacio?: boolean
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <span className="shrink-0 text-sm text-tertiary">{etiqueta}</span>
      <span
        className={cn(
          'min-w-0 break-words text-sm font-medium text-primary',
          monoespacio && 'font-mono text-xs break-all',
        )}
      >
        {valor}
      </span>
    </div>
  )
}

function Indicador({
  titulo,
  valor,
  tono,
  detalle,
}: {
  titulo: string
  valor: string
  tono: TonoBadge
  detalle: string
}) {
  return (
    <Card className="p-4">
      <p className="text-xs font-semibold tracking-wide text-tertiary uppercase">{titulo}</p>
      <div className="mt-2">
        <Badge tone={tono}>{valor}</Badge>
      </div>
      <p className="mt-2 text-xs text-tertiary">{detalle}</p>
    </Card>
  )
}

function Requisito({
  cumplido,
  titulo,
  detalle,
}: {
  cumplido: boolean
  titulo: string
  detalle: string
}) {
  return (
    <li className="flex items-start gap-3 rounded-lg bg-secondary p-3">
      <span
        className={cn(
          'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full',
          cumplido
            ? 'bg-success-secondary text-fg-success-primary'
            : 'bg-warning-secondary text-fg-warning-primary',
        )}
      >
        <Icon name={cumplido ? 'check' : 'warning'} className="size-3.5" />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-medium text-primary">{titulo}</p>
        <p className="mt-0.5 text-xs break-words text-tertiary">{detalle}</p>
      </div>
    </li>
  )
}

function Series({ series }: { series: ConfiguracionSunat['series'] }) {
  return (
    <Card>
      <CardHeader
        title="Series y correlativos"
        description="Cada serie incrementa su número de forma atómica al emitir."
      />
      <div className="border-t border-tertiary p-4 sm:p-6">
        {series.length === 0 ? (
          <p className="py-4 text-sm text-tertiary">Todavía no hay series configuradas.</p>
        ) : (
          <>
            <table className="hidden w-full text-left text-sm sm:table">
              <thead className="text-xs text-tertiary uppercase">
                <tr>
                  <th className="pb-2 font-medium">Documento</th>
                  <th className="pb-2 font-medium">Serie</th>
                  <th className="pb-2 text-right font-medium">Siguiente</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-tertiary">
                {series.map((serie) => (
                  <tr key={`${serie.tipo}-${serie.serie}`}>
                    <td className="py-2.5 text-secondary">
                      {ETIQUETAS_SERIE[serie.tipo] ?? serie.tipo}
                    </td>
                    <td className="py-2.5 font-mono text-primary">{serie.serie}</td>
                    <td className="py-2.5 text-right font-mono font-medium text-primary">
                      {consecutivo(serie.siguiente)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <ul className="divide-y divide-tertiary sm:hidden">
              {series.map((serie) => (
                <li key={`${serie.tipo}-${serie.serie}`} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-primary">
                      {ETIQUETAS_SERIE[serie.tipo] ?? serie.tipo}
                    </p>
                    <p className="font-mono text-xs text-tertiary">{serie.serie}</p>
                  </div>
                  <span className="shrink-0 font-mono text-sm font-medium text-primary">
                    {consecutivo(serie.siguiente)}
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </Card>
  )
}

export function ConfiguracionPage() {
  const { data, error, loading } = useAsyncData(configuracionService.obtener, [])

  if (loading) return <ConfiguracionSkeleton />

  if (!data) {
    return (
      <div className="flex w-full flex-col gap-4 px-4 pt-8 lg:px-8 lg:pt-12">
        <PageHeader
          title="Configuración SUNAT"
          description="Estado del emisor, canales de envío, correlativos e integraciones."
        />
        <Alert tone="error" title="No se pudo leer la configuración">
          {error?.message ?? 'El servidor no devolvió datos de configuración.'}
        </Alert>
      </div>
    )
  }

  const { empresa, sunat, gre, resumenes, integraciones } = data
  const produccion = sunat.modo === 'produccion'
  const directo = sunat.proveedor === 'sunat-direct'
  const greLista = gre.modo === 'produccion' && gre.configurado

  const requisitos = [
    {
      cumplido: directo,
      titulo: 'Proveedor oficial directo',
      detalle: 'SUNAT_PROVEEDOR=direct · sin APIs de terceros',
    },
    {
      cumplido: sunat.credencialesSolConfiguradas,
      titulo: 'Credenciales SOL del emisor',
      detalle: 'Usuario y contraseña del servidor (nunca se muestran)',
    },
    {
      cumplido: sunat.certificadoConfigurado,
      titulo: 'Certificado de firma',
      detalle: 'PFX o certificado + clave privada vigentes',
    },
    {
      cumplido: Boolean(sunat.ruc),
      titulo: 'RUC usado al firmar',
      detalle: sunat.ruc ? sunat.ruc : 'Falta SUNAT_RUC en el entorno del servidor',
    },
    {
      cumplido: data.series.length > 0,
      titulo: 'Series con correlativos',
      detalle: `${data.series.length} serie${data.series.length === 1 ? '' : 's'} activa${data.series.length === 1 ? '' : 's'} en la base de datos`,
    },
    {
      cumplido: greLista,
      titulo: 'Guías por API REST (si emites guías)',
      detalle: 'SUNAT_GRE_MODO=produccion y credenciales de API SUNAT del Menú SOL',
    },
    {
      cumplido: resumenes.envioReal,
      titulo: 'Resúmenes y bajas hacia SUNAT',
      detalle: 'RC/RA por el emisor directo, sin atajo local',
    },
  ]

  return (
    <div className="flex w-full flex-col gap-6 px-4 pt-8 pb-16 lg:px-8 lg:pt-12">
      <PageHeader
        title="Configuración SUNAT"
        description="Emisor, canales de envío, correlativos e integraciones. Solo se muestran estados: los secretos permanecen en el servidor."
        actions={
          <Badge tone="gray" startIcon={<Icon name="lock" className="size-3.5" />}>
            Solo lectura
          </Badge>
        }
      />

      {error && (
        <Alert tone="warning" title="Datos parciales">
          La configuración se mostró con la última respuesta disponible. {error.message}
        </Alert>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Indicador
          titulo="Proveedor"
          valor={directo ? 'Oficial directo' : sunat.proveedor}
          tono={directo ? 'success' : 'warning'}
          detalle="Emisión sin proveedores externos"
        />
        <Indicador
          titulo="Ambiente de comprobantes"
          valor={produccion ? 'Producción' : sunat.modo === 'beta' ? 'Beta' : 'Local'}
          tono={produccion ? 'success' : 'warning'}
          detalle="Aplica a facturas, boletas, notas y RC/RA"
        />
        <Indicador
          titulo="Guías de remisión"
          valor={gre.modo === 'produccion' ? 'Producción' : 'Desactivado'}
          tono={greLista ? 'success' : 'warning'}
          detalle="No existe ambiente beta para GRE"
        />
        <Indicador
          titulo="Credenciales y certificado"
          valor={
            directo && sunat.credencialesSolConfiguradas && sunat.certificadoConfigurado
              ? 'Completos'
              : 'Incompletos'
          }
          tono={
            directo && sunat.credencialesSolConfiguradas && sunat.certificadoConfigurado
              ? 'success'
              : 'warning'
          }
          detalle="Valores verificados en el entorno del servidor"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <Card>
          <CardHeader title="Emisor" description="Datos que viajan en el XML UBL 2.1" />
          <div className="space-y-3 border-t border-tertiary p-4 text-sm sm:p-6">
            <Dato etiqueta="RUC" valor={empresa.ruc || 'No configurado'} monoespacio />
            <Dato etiqueta="Razón social" valor={empresa.razonSocial || 'No configurada'} />
            <Dato etiqueta="Dirección" valor={empresa.direccion || 'No configurada'} />
            <Dato
              etiqueta="Ubigeo"
              valor={
                empresa.ubigeo
                  ? `${empresa.ubigeo} · ${empresa.distrito}, ${empresa.provincia}, ${empresa.departamento}`
                  : 'No configurado'
              }
            />
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Emisión directa"
            description="Comprobantes y notas por SOAP del emisor oficial"
          />
          <div className="space-y-3 border-t border-tertiary p-4 text-sm sm:p-6">
            <Dato etiqueta="Proveedor" valor={sunat.proveedor} monoespacio />
            <Dato
              etiqueta="Ambiente"
              valor={
                <Badge tone={produccion ? 'success' : 'warning'}>
                  {produccion ? 'producción' : sunat.modo === 'beta' ? 'beta' : 'local'}
                </Badge>
              }
            />
            <Dato
              etiqueta="Credenciales SOL"
              valor={
                <Badge tone={sunat.credencialesSolConfiguradas ? 'success' : 'gray'}>
                  {sunat.credencialesSolConfiguradas ? 'Configuradas' : 'Faltan'}
                </Badge>
              }
            />
            <Dato
              etiqueta="Certificado"
              valor={
                <Badge tone={sunat.certificadoConfigurado ? 'success' : 'gray'}>
                  {sunat.certificadoConfigurado ? 'Configurado' : 'Falta'}
                </Badge>
              }
            />
            <Dato etiqueta="Timeout" valor={`${sunat.timeoutMs / 1000} s`} />
            <div>
              <p className="text-sm text-tertiary">Endpoint SOAP</p>
              <p className="mt-1 rounded-lg bg-secondary px-3 py-2 font-mono text-xs break-all text-secondary">
                {sunat.endpoint}
              </p>
            </div>
            {!directo && (
              <Alert tone="warning">
                El proveedor activo no envía comprobantes a SUNAT. Revisa el entorno del servidor.
              </Alert>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Guías de remisión"
            description="API REST oficial GRE: OAuth, ticket y CDR"
          />
          <div className="space-y-3 border-t border-tertiary p-4 text-sm sm:p-6">
            <Dato
              etiqueta="Estado"
              valor={
                <Badge tone={greLista ? 'success' : 'warning'}>
                  {gre.modo === 'produccion' ? 'Producción' : 'Desactivado'}
                </Badge>
              }
            />
            <Dato
              etiqueta="Credenciales de API"
              valor={
                <Badge tone={gre.configurado ? 'success' : 'gray'}>
                  {gre.configurado ? 'Configuradas' : 'Faltan'}
                </Badge>
              }
            />
            <Dato etiqueta="Token" valor={gre.tokenEndpoint} monoespacio />
            <Dato etiqueta="API" valor={gre.apiBase} monoespacio />
            <Dato
              etiqueta="Consultas"
              valor={`${gre.timeoutMs / 1000} s · ${gre.intentos} intentos · ${gre.intervaloMs / 1000} s`}
            />
            {gre.modo !== 'produccion' && (
              <Alert tone="info">
                Las guías solo se envían cuando se activa explícitamente GRE en producción. No hay
                emisión local ni prueba beta para este documento.
              </Alert>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Resúmenes y bajas"
            description="RC/RA por ticket, constancia CDR y sin reenvío del mismo ticket"
          />
          <div className="space-y-3 border-t border-tertiary p-4 text-sm sm:p-6">
            <Dato
              etiqueta="Envío a SUNAT"
              valor={
                <Badge tone={resumenes.envioReal ? 'success' : 'warning'}>
                  {resumenes.envioReal ? 'Habilitado' : 'Modo local'}
                </Badge>
              }
            />
            <Dato
              etiqueta="Ambiente"
              valor={
                <Badge tone={resumenes.modo === 'produccion' ? 'success' : 'warning'}>
                  {resumenes.modo === 'produccion'
                    ? 'producción'
                    : resumenes.modo === 'beta'
                      ? 'beta'
                      : 'local'}
                </Badge>
              }
            />
            <p className="text-xs text-tertiary">
              Comparte <span className="font-mono">SUNAT_MODO</span> con facturas y boletas: cambiar
              a producción afecta también a esos comprobantes. Los tickets pendientes se consultan,
              nunca se reenvían.
            </p>
            {!resumenes.envioReal && (
              <Alert tone="warning">
                Sin credenciales del emisor directo, RC/RA quedan como registro local con prefijo
                LOCAL-.
              </Alert>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Integraciones"
            description="Servicios auxiliares y almacenamiento de comprobantes"
          />
          <div className="space-y-3 border-t border-tertiary p-4 text-sm sm:p-6">
            <Dato
              etiqueta="Consulta RENIEC"
              valor={
                <Badge tone={integraciones.reniec ? 'success' : 'gray'}>
                  {integraciones.reniec ? 'Disponible' : 'No configurada'}
                </Badge>
              }
            />
            <Dato
              etiqueta="Archivos XML/ZIP/CDR"
              valor={
                <Badge tone={integraciones.almacenamiento ? 'success' : 'gray'}>
                  {integraciones.almacenamiento ? 'Almacenamiento remoto' : 'No configurado'}
                </Badge>
              }
            />
            <p className="text-xs text-tertiary">
              Las credenciales de estos servicios tampoco se muestran en la interfaz.
            </p>
          </div>
        </Card>
      </div>

      <Series series={data.series} />

      <Card>
        <CardHeader
          title="Antes de emitir en producción"
          description="Comprobación de configuración; no activa ni cambia el ambiente."
        />
        <div className="border-t border-tertiary p-4 sm:p-6">
          <ul className="grid gap-3 lg:grid-cols-2">
            {requisitos.map((requisito) => (
              <Requisito key={requisito.titulo} {...requisito} />
            ))}
          </ul>
          <div className="mt-4">
            <Alert tone="info" title="Activación">
              El cambio a producción requiere autorización explícita, credenciales SOL reales,
              certificado vigente y validar el primer CDR. Las guías necesitan además activar GRE y
              sus credenciales de API SUNAT del Menú SOL.
            </Alert>
          </div>
        </div>
      </Card>
    </div>
  )
}
