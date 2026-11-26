/** Fecha de hoy en Lima en formato AAAA-MM-DD, sin depender del huso del navegador. */
export const hoyEnLima = () =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Lima',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())

/** Parte AAAA-MM-DD de una fecha ISO guardada en la base. */
export const fechaISO = (iso: string) => iso.slice(0, 10)
