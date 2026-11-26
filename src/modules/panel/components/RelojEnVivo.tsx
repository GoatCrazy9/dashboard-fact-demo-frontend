import { useEffect, useState } from 'react'

const formatoHora = new Intl.DateTimeFormat('es-PE', {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
})

/** Hora local del sistema, actualizada cada segundo. */
export function RelojEnVivo() {
  const [ahora, setAhora] = useState(() => new Date())

  useEffect(() => {
    const temporizador = window.setInterval(() => setAhora(new Date()), 1000)
    return () => window.clearInterval(temporizador)
  }, [])

  return (
    <time dateTime={ahora.toISOString()} className="tabular-nums">
      {formatoHora.format(ahora)}
    </time>
  )
}
