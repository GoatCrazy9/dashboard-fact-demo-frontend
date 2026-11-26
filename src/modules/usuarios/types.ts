export type RolGestion = 'ADMIN' | 'MAESTRO' | 'VENDEDOR'

export interface UsuarioGestion {
  id: string
  nombre: string
  usuario: string
  rol: RolGestion
  activo: boolean
  puedeFacturar: boolean
  creadoEn: string
}

export interface CrearUsuarioInput {
  nombre: string
  usuario: string
  password: string
  rol?: RolGestion
  puedeFacturar?: boolean
}

export interface ActualizarAccesoInput {
  puedeFacturar?: boolean
  activo?: boolean
}

export interface CambiarPasswordInput {
  password: string
}
