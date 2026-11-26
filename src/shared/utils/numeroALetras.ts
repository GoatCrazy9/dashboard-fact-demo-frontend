const UNIDADES = [
  '',
  'UNO',
  'DOS',
  'TRES',
  'CUATRO',
  'CINCO',
  'SEIS',
  'SIETE',
  'OCHO',
  'NUEVE',
]

const DECENAS = [
  'DIEZ',
  'ONCE',
  'DOCE',
  'TRECE',
  'CATORCE',
  'QUINCE',
  'DIECISÉIS',
  'DIECISIETE',
  'DIECIOCHO',
  'DIECINUEVE',
]

const DECENAS_SUPERIORES = [
  '',
  '',
  'VEINTE',
  'TREINTA',
  'CUARENTA',
  'CINCUENTA',
  'SESENTA',
  'SETENTA',
  'OCHENTA',
  'NOVENTA',
]

const VEINTI = [
  '',
  'VEINTIUNO',
  'VEINTIDOS',
  'VEINTITRÉS',
  'VEINTICUATRO',
  'VEINTICINCO',
  'VEINTISÉIS',
  'VEINTISIETE',
  'VEINTIOCHO',
  'VEINTINUEVE',
]

const CENTENAS = [
  '',
  'CIEN',
  'DOSCIENTOS',
  'TRESCIENTOS',
  'CUATROCIENTOS',
  'QUINIENTOS',
  'SEISCIENTOS',
  'SETECIENTOS',
  'OCHOCIENTOS',
  'NOVECIENTOS',
]

function menosMil(valor: number): string {
  if (valor === 0) return ''
  if (valor < 10) return UNIDADES[valor]
  if (valor < 20) return DECENAS[valor - 10]
  if (valor < 100) {
    const decena = Math.floor(valor / 10)
    const unidad = valor % 10
    if (decena === 2) return VEINTI[unidad]
    return `${DECENAS_SUPERIORES[decena]}${unidad ? ` ${UNIDADES[unidad]}` : ''}`
  }

  const centena = Math.floor(valor / 100)
  const resto = valor % 100
  const prefijo = centena === 1 && resto > 0 ? 'CIENTO' : CENTENAS[centena]
  return `${prefijo}${resto ? ` ${menosMil(resto)}` : ''}`
}

function enPalabras(valor: number): string {
  if (valor < 1000) return menosMil(valor)
  if (valor < 1_000_000) {
    const miles = Math.floor(valor / 1000)
    const resto = valor % 1000
    const prefijo = miles === 1 ? 'UN MIL' : `${menosMil(miles)} MIL`
    return `${prefijo}${resto ? ` ${menosMil(resto)}` : ''}`
  }
  if (valor < 1_000_000_000) {
    const millones = Math.floor(valor / 1_000_000)
    const resto = valor % 1_000_000
    const prefijo = millones === 1 ? 'UN MILLÓN' : `${menosMil(millones)} MILLONES`
    return `${prefijo}${resto ? ` ${enPalabras(resto)}` : ''}`
  }
  return menosMil(valor)
}

/** Convierte un importe a la frase usada en las boletas de DEMO: "UN MIL ... CON 00/100". */
export function numeroALetras(valor: number): string {
  const absoluto = Math.abs(valor)
  const entero = Math.floor(absoluto)
  const centavos = Math.round((absoluto - entero) * 100)
  const texto = entero === 0 ? 'CERO' : enPalabras(entero)
  return `${valor < 0 ? 'MENOS ' : ''}${texto} CON ${String(centavos).padStart(2, '0')}/100`
}
