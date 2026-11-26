import { useCallback, useEffect, useState } from 'react'

type Fetchers<T> = { [K in keyof T]: () => Promise<T[K]> }

export interface FuentesDatos<T> {
  datos: { [K in keyof T]: T[K] | null }
  cargando: boolean
  /** Nombres de las fuentes que fallaron; las demás siguen disponibles. */
  fuentesConError: string[]
  errores: { [K in keyof T]: Error | null }
  retry: () => void
}

/**
 * Carga varias fuentes en paralelo con `Promise.allSettled`: si una falla, las
 * demás siguen disponibles. Es el mismo contrato que usa el GlobalSearch de dojo.
 */
export function useFuentesDatos<T extends Record<string, unknown>>(
  fuentes: Fetchers<T>,
  deps: unknown[] = [],
): FuentesDatos<T> {
  const claves = Object.keys(fuentes) as Array<keyof T>
  const nulo = () =>
    Object.fromEntries(claves.map((k) => [k, null])) as { [K in keyof T]: T[K] | null }
  const nuloErrores = () =>
    Object.fromEntries(claves.map((k) => [k, null])) as { [K in keyof T]: Error | null }

  const [datos, setDatos] = useState<{ [K in keyof T]: T[K] | null }>(nulo)
  const [cargando, setCargando] = useState(true)
  const [fuentesConError, setFuentesConError] = useState<string[]>([])
  const [errores, setErrores] = useState<{ [K in keyof T]: Error | null }>(nuloErrores)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    let activo = true
    setCargando(true)
    Promise.allSettled(claves.map((k) => fuentes[k]())).then((resultados) => {
      if (!activo) return
      const parcial = nulo()
      const parcialErrores = nuloErrores()
      const fallidas: string[] = []
      resultados.forEach((r, i) => {
        if (r.status === 'fulfilled') parcial[claves[i]] = r.value
        else {
          parcialErrores[claves[i]] = r.reason instanceof Error ? r.reason : new Error('Error de red')
          fallidas.push(String(claves[i]))
        }
      })
      setDatos(parcial)
      setErrores(parcialErrores)
      setFuentesConError(fallidas)
      setCargando(false)
    })
    return () => {
      activo = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, ...deps])

  const retry = useCallback(() => setTick((t) => t + 1), [])
  return { datos, cargando, fuentesConError, errores, retry }
}
