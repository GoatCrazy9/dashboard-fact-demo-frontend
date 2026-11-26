import { createContext, useContext } from 'react'

/**
 * Densidad visual de un bloque de interfaz (listados y formularios). `compact` reduce
 * tipografía y espaciado de los controles que la heredan a través de `DensityContext`.
 */
export type Density = 'default' | 'compact'

export const DensityContext = createContext<Density>('default')

/** Densidad vigente según el `DensityContext` del bloque contenedor. */
export function useDensity(): Density {
  return useContext(DensityContext)
}
