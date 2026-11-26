import { numeroALetras } from '@/shared/utils/numeroALetras'

export interface ItemBoletaPreview {
  codigo: string
  descripcion: string
  unidad: string
  cantidad: number
  precioUnitario: number
  total: number
}

export interface BoletaPreviewProps {
  tipo: 'BOLETA' | 'FACTURA'
  empresa: { ruc: string; razonSocial: string; direccion: string; distrito: string }
  cliente: { nombre: string; numeroDocumento: string; direccion: string; telefono: string }
  tipoDocumento: string
  fecha: string
  formaPago: string
  condicionesPago: string
  moneda: string
  tipoCambio: number
  items: ItemBoletaPreview[]
  subtotal: number
  igv: number
  total: number
  detraccion?: { codigo: string; nombre: string; tasa: number; monto: number } | null
}

const numero = (valor: number) =>
  new Intl.NumberFormat('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(
    valor,
  )

const fechaTicket = (iso: string) => {
  if (!iso) return '——/——/——'
  return new Intl.DateTimeFormat('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'America/Lima',
  }).format(new Date(`${iso}T12:00:00`))
}

/** Ticket térmico de 80 mm con los datos capturados en el formulario de ventas. */
export function BoletaPreview({
  tipo,
  empresa,
  cliente,
  tipoDocumento,
  fecha,
  formaPago,
  condicionesPago,
  moneda,
  tipoCambio,
  items,
  subtotal,
  igv,
  total,
  detraccion,
}: BoletaPreviewProps) {
  const simbolo = moneda === 'USD' ? 'US$' : 'S/'
  const monedaTexto = moneda === 'USD' ? 'DÓLARES' : 'SOLES'

  return (
    <div
      className="print-area mx-auto bg-white px-[3mm] py-[4mm] text-[#111] shadow-xs ring-1 ring-tertiary"
      style={{
        width: '80mm',
        maxWidth: '100%',
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace',
        fontSize: '10px',
        lineHeight: 1.3,
      }}
    >
      <div className="text-center font-bold uppercase">MUEBLERÍA JOSE</div>
      <div className="text-center">De: Urquiza Cabrera Jose Humberto</div>
      <div className="text-center font-semibold">FABRICANTE DE MUEBLES DE DORMITORIO</div>
      <div className="text-center">RUC: {empresa.ruc}</div>
      <div className="mt-1 text-center">Venta de Colchones, Juego de Dormitorio, Camarote</div>
      <div className="text-center">Tarimas, Comodas y Veladores, Cabezeras Tapizadas</div>
      <div className="text-center">Modelos Exclusivos</div>
      <div className="mt-1 text-center">{empresa.direccion}</div>
      <div className="text-center">Cel.: 955 779 178</div>

      <div className="my-2 border-t border-dashed border-[#111]" />
      <div className="text-center font-bold">
        {tipo === 'FACTURA' ? 'FACTURA ELECTRÓNICA' : 'BOLETA DE VENTA ELECTRÓNICA'}
      </div>
      <div className="text-center font-semibold">
        {tipo === 'FACTURA' ? 'F001' : 'B001'} - 00000000
      </div>
      <div className="text-center">{fechaTicket(fecha)}</div>
      <div className="text-center font-semibold">*** VISTA PREVIA - NO EMITIDA ***</div>
      <div className="my-2 border-t border-dashed border-[#111]" />

      <div>CLIENTE: {cliente.nombre || '—'}</div>
      <div>
        {tipoDocumento}: {cliente.numeroDocumento || '—'}
      </div>
      {cliente.direccion && <div>DIRECCIÓN: {cliente.direccion}</div>}
      {cliente.telefono && <div>Teléfono: {cliente.telefono}</div>}
      <div>FORMA DE PAGO: {formaPago}</div>
      <div>CONDICIÓN: {condicionesPago}</div>
      <div>MONEDA: {moneda === 'USD' ? 'DÓLARES' : 'SOLES'}</div>
      {moneda === 'USD' && <div>TIPO DE CAMBIO: {numero(tipoCambio)}</div>}
      <div className="my-2 border-t border-dashed border-[#111]" />

      <div className="grid grid-cols-[28px_28px_1fr_50px_58px] font-semibold">
        <span>CAN</span>
        <span>U.M</span>
        <span>DESCRIPCION</span>
        <span className="text-right">P.UNIT</span>
        <span className="text-right">IMPORTE</span>
      </div>
      {items.length === 0 && <div className="mt-1 text-center">Sin ítems</div>}
      {items.map((item) => (
        <div key={item.codigo || item.descripcion} className="mt-1">
          <div className="grid grid-cols-[28px_28px_1fr_50px_58px]">
            <span>{numero(item.cantidad)}</span>
            <span>{item.unidad.slice(0, 4)}</span>
            <span className="break-words">{item.codigo}</span>
            <span className="text-right">{numero(item.precioUnitario)}</span>
            <span className="text-right">{numero(item.total)}</span>
          </div>
          <div className="break-words pl-[56px]">{item.descripcion}</div>
        </div>
      ))}

      <div className="my-2 border-t border-dashed border-[#111]" />
      <div className="ml-auto w-[190px] space-y-0.5">
        <div className="flex justify-between">
          <span>Op/Grav.</span>
          <span>{numero(subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span>I.G.V</span>
          <span>
            {simbolo} {numero(igv)}
          </span>
        </div>
        <div className="flex justify-between font-bold">
          <span>Importe Total</span>
          <span>
            {simbolo} {numero(total)}
          </span>
        </div>
        {detraccion && (
          <div className="border-t border-dashed border-[#111] pt-0.5 text-[9px]">
            DETRACCIÓN {detraccion.codigo} ({detraccion.tasa}%): {simbolo} {numero(detraccion.monto)}
          </div>
        )}
      </div>

      <div className="mt-2">SON: {numeroALetras(total)} {monedaTexto}</div>
      <div>
        ({moneda}) - Forma de Pago: {formaPago} · {condicionesPago}
      </div>
      <div className="my-2 border-t border-dashed border-[#111]" />

      <div className="text-center">
        TODO CAMBIO O DEVOLUCION DEL PRODUCTO DEBE SER DENTRO DE LOS 3 DIAS CALENDARIOS CON SU
        RESPECTIVO COMPROBANTE SIEMPRE Y CUANDO EL PRODUCTO NO HAYA SIDO UTILIZADO Y CON EMPAQUES
        ORIGINALES, NO HAY DEVOLUCION DE DINERO
      </div>
      <div className="mt-2 text-center font-semibold">GRACIAS POR SU PREFERENCIA, VUELVA PRONTO</div>
      <div className="mt-2 text-center">
        Autorizado mediante SOL para la Emisión de Comprobantes Electrónicos desde los Sistemas
        del Contribuyente (SEE-DSC)
      </div>
      <div className="mt-1 text-center">
        Puede consultar este comprobante en:
        <br />
        http://www.sunat.gob.pe/ol-ti-itconsvalicpe/ConsValiCpe.htm
      </div>
      <div className="mt-2 text-center">Sistema SICAP RP</div>
    </div>
  )
}
