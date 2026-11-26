import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useAsyncData } from '@/shared/hooks/useAsyncData'
import { Alert } from '@/shared/ui/Alert'
import { AvatarPerfil } from '@/shared/ui/AvatarPerfil'
import { Badge } from '@/shared/ui/Badge'
import { Button } from '@/shared/ui/Button'
import { Card, CardBody, CardHeader } from '@/shared/ui/Card'
import { Checkbox } from '@/shared/ui/Checkbox'
import { DataTable, type Column } from '@/shared/ui/DataTable'
import { Icon } from '@/shared/ui/icons'
import { UsuariosSkeleton } from '@/shared/ui/ListadoSkeleton'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Select } from '@/shared/ui/Select'
import { StatCard } from '@/shared/ui/StatCard'
import { TextField } from '@/shared/ui/TextField'
import { CambiarPasswordDialog } from '../components/CambiarPasswordDialog'
import { usuariosService } from '../service/usuariosService'
import type { RolGestion, UsuarioGestion } from '../types'

const etiquetaRol: Record<RolGestion, string> = {
  ADMIN: 'Administrador',
  MAESTRO: 'Maestro',
  VENDEDOR: 'Vendedor',
}

const tonoRol: Record<RolGestion, 'brand' | 'success' | 'gray'> = {
  ADMIN: 'brand',
  MAESTRO: 'success',
  VENDEDOR: 'gray',
}

function validarFormulario(
  nombre: string,
  usuario: string,
  password: string,
): string | null {
  if (nombre.trim().length < 2) return 'Escribe el nombre completo del usuario.'
  if (!/^[a-z0-9._-]{3,}$/i.test(usuario.trim())) {
    return 'El usuario necesita al menos 3 caracteres: letras, números, punto, guion o guion bajo.'
  }
  if (password.length < 8) return 'La contraseña debe tener al menos 8 caracteres.'
  return null
}

function TituloSeccion({ numero, titulo }: { numero: string; titulo: string }) {
  return (
    <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-primary">
      <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-primary text-xs font-semibold text-brand-secondary ring-1 ring-brand ring-inset">
        {numero}
      </span>
      {titulo}
    </h3>
  )
}

export function MaestroPage() {
  const { user } = useAuth()
  const { data, error, loading, reload } = useAsyncData(usuariosService.listar, [])

  const [nombre, setNombre] = useState('')
  const [usuario, setUsuario] = useState('')
  const [password, setPassword] = useState('')
  const [rol, setRol] = useState<Exclude<RolGestion, 'MAESTRO'>>('VENDEDOR')
  const [puedeFacturar, setPuedeFacturar] = useState(false)
  const [creando, setCreando] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const [accionId, setAccionId] = useState<string | null>(null)
  const [cambiandoPassword, setCambiandoPassword] = useState<UsuarioGestion | null>(null)

  const usuarios = data ?? []
  const activos = usuarios.filter((fila) => fila.activo).length
  const conFacturacion = usuarios.filter((fila) => fila.puedeFacturar).length
  const vendedores = usuarios.filter((fila) => fila.rol === 'VENDEDOR').length

  if (loading) return <UsuariosSkeleton />

  async function handleCrear() {
    const problema = validarFormulario(nombre, usuario, password)
    if (problema) {
      setFormError(problema)
      return
    }

    setCreando(true)
    setFormError(null)
    setAviso(null)
    try {
      const creado = await usuariosService.crear({
        nombre: nombre.trim(),
        usuario: usuario.trim().toLowerCase(),
        password,
        rol,
        puedeFacturar,
      })
      setAviso(
        `${creado.nombre} fue creado como ${creado.rol === 'ADMIN' ? 'administrador' : 'vendedor'}${creado.puedeFacturar ? ' con acceso a facturación' : ' sin acceso a facturación'}.`,
      )
      setNombre('')
      setUsuario('')
      setPassword('')
      setRol('VENDEDOR')
      setPuedeFacturar(false)
      reload()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'No se pudo crear el usuario.')
    } finally {
      setCreando(false)
    }
  }

  async function handleAcceso(fila: UsuarioGestion, datos: { puedeFacturar?: boolean; activo?: boolean }) {
    setAccionId(fila.id)
    setAviso(null)
    try {
      const actualizado = await usuariosService.actualizarAcceso(fila.id, datos)
      setAviso(
        datos.activo !== undefined
          ? `${actualizado.nombre} ${actualizado.activo ? 'quedó activo' : 'quedó inactivo'}.`
          : `${actualizado.nombre} ${actualizado.puedeFacturar ? 'ahora tiene' : 'ya no tiene'} acceso a facturación.`,
      )
      reload()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'No se pudo actualizar el acceso.')
    } finally {
      setAccionId(null)
    }
  }

  const columnas: Column<UsuarioGestion>[] = [
    {
      key: 'usuario',
      header: 'Usuario',
      render: (fila) => (
        <div className="flex min-w-0 items-center gap-3">
          <AvatarPerfil
            nombre={fila.usuario}
            tamano={36}
            enLinea={fila.activo}
            etiqueta={`Avatar de ${fila.nombre}`}
          />
          <div className="min-w-0">
            <p className="truncate font-medium text-primary">{fila.nombre}</p>
            <p className="truncate text-xs text-tertiary">@{fila.usuario}</p>
          </div>
        </div>
      ),
      sortValue: (fila) => fila.nombre,
    },
    {
      key: 'rol',
      header: 'Rol',
      render: (fila) => (
        <Badge tone={tonoRol[fila.rol] ?? 'gray'}>{etiquetaRol[fila.rol] ?? fila.rol}</Badge>
      ),
    },
    {
      key: 'acceso',
      header: 'Facturación',
      render: (fila) => (
        <Badge tone={fila.puedeFacturar ? 'success' : 'gray'}>
          {fila.puedeFacturar ? 'Con acceso' : 'Sin acceso'}
        </Badge>
      ),
    },
    {
      key: 'estado',
      header: 'Estado',
      render: (fila) => (
        <Badge tone={fila.activo ? 'brand' : 'error'}>{fila.activo ? 'Activo' : 'Inactivo'}</Badge>
      ),
      hideOnMobileCards: true,
    },
    {
      key: 'acciones',
      header: 'Accesos',
      isActions: true,
      render: (fila) => {
        // El maestro gestiona accesos de vendedores y administradores, pero no de otros maestros.
        const gestionable = fila.rol !== 'MAESTRO'
        const esPropio = fila.id === user?.id
        const puedeCambiarPassword = fila.rol !== 'MAESTRO' || esPropio
        const ocupado = accionId === fila.id
        return (
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              size="xs"
              variant={fila.puedeFacturar ? 'primary' : 'outline'}
              isDisabled={ocupado || !gestionable}
              onClick={() => void handleAcceso(fila, { puedeFacturar: !fila.puedeFacturar })}
            >
              <Icon name={fila.puedeFacturar ? 'check' : 'plus'} className="size-3.5" />
              {fila.puedeFacturar ? 'Quitar acceso' : 'Dar acceso'}
            </Button>
            <Button
              size="xs"
              variant="outline"
              isDisabled={ocupado || !gestionable}
              onClick={() => void handleAcceso(fila, { activo: !fila.activo })}
            >
              {fila.activo ? 'Desactivar' : 'Activar'}
            </Button>
            <Button
              size="xs"
              variant="ghost"
              isDisabled={!puedeCambiarPassword}
              aria-label={`Cambiar contraseña de ${fila.nombre}`}
              onClick={() => setCambiandoPassword(fila)}
              startIcon={<Icon name="lock" className="size-3.5" />}
            >
              {esPropio ? 'Mi contraseña' : 'Contraseña'}
            </Button>
          </div>
        )
      },
    },
  ]

  return (
    <>
      <PageHeader
        title="Usuarios y accesos"
        description="Crea vendedores y administradores, gestiona sus accesos y renueva contraseñas. Sección exclusiva del maestro."
        actions={<Badge tone="gray">{usuarios.length} cuentas</Badge>}
      />

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total cuentas"
          value={usuarios.length}
          hint="Registradas en el sistema"
          icon="users"
          isLoading={loading}
        />
        <StatCard
          label="Activas"
          value={activos}
          hint="Pueden iniciar sesión"
          icon="check"
          isLoading={loading}
        />
        <StatCard
          label="Con facturación"
          value={conFacturacion}
          hint="Pueden emitir comprobantes"
          icon="bolt"
          isLoading={loading}
        />
        <StatCard
          label="Vendedores"
          value={vendedores}
          hint="Equipo de ventas"
          icon="user"
          isLoading={loading}
        />
      </div>

      {error && (
        <div className="mb-4">
          <Alert tone="error" title="No se pudo cargar la lista">
            {error.message}
          </Alert>
        </div>
      )}
      {formError && (
        <div className="mb-4">
          <Alert tone="error" title="Revisa la operación">
            {formError}
          </Alert>
        </div>
      )}
      {aviso && (
        <div className="mb-4">
          <Alert tone="success">{aviso}</Alert>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader
            title="Nuevo usuario"
            description="La contraseña se guarda cifrada."
            density="compact"
          />
          <CardBody className="flex flex-col gap-6">
            <section>
              <TituloSeccion numero="01" titulo="Datos de la cuenta" />
              <div className="flex flex-col gap-4">
                <TextField
                  label="Nombre completo"
                  value={nombre}
                  onChange={setNombre}
                  placeholder="Ej. María Pérez"
                  maxLength={80}
                  requiredMark
                  inputClassName="text-md"
                />
                <TextField
                  label="Usuario"
                  value={usuario}
                  onChange={setUsuario}
                  placeholder="Ej. maria.perez"
                  maxLength={255}
                  requiredMark
                  inputClassName="text-md"
                  hint="Se usa para iniciar sesión."
                />
                <TextField
                  label="Contraseña inicial"
                  type="password"
                  value={password}
                  onChange={setPassword}
                  placeholder="Mínimo 8 caracteres"
                  maxLength={128}
                  requiredMark
                  inputClassName="text-md"
                />
              </div>
            </section>

            <section>
              <TituloSeccion numero="02" titulo="Permisos" />
              <div className="flex flex-col gap-4">
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-secondary">Rol</span>
                  <Select
                    ariaLabel="Rol del usuario"
                    value={rol}
                    onChange={(valor) => setRol(valor as Exclude<RolGestion, 'MAESTRO'>)}
                    options={[
                      { value: 'VENDEDOR', label: 'Vendedor' },
                      { value: 'ADMIN', label: 'Administrador' },
                    ]}
                  />
                  <span className="text-xs text-tertiary">
                    Puedes crear vendedores y administradores; no otros maestros.
                  </span>
                </label>
                <div className="rounded-xl bg-secondary p-3.5 ring-1 ring-tertiary ring-inset">
                  <Checkbox
                    size="md"
                    label="Acceso al sistema de facturación"
                    hint="Sin este permiso el usuario no podrá emitir comprobantes."
                    isSelected={puedeFacturar}
                    onChange={setPuedeFacturar}
                  />
                </div>
                <Button
                  variant="primary"
                  fullWidth
                  isLoading={creando}
                  isDisabled={creando}
                  onClick={() => void handleCrear()}
                  startIcon={<Icon name="plus" className="size-4" />}
                >
                  Crear usuario
                </Button>
              </div>
            </section>
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader
            title="Cuentas"
            description={`${usuarios.length} usuarios registrados · usa “Contraseña” para renovar el acceso`}
            density="compact"
          />
          <div className="border-t border-tertiary p-3 sm:p-4">
            <DataTable
              columns={columnas}
              rows={usuarios}
              rowKey={(fila) => fila.id}
              emptyTitle="Sin usuarios"
              emptyDescription="Crea la primera cuenta con el formulario."
              pagination={{ pageSize: 12 }}
              loading={loading}
              mobileLayout="cards"
            />
          </div>
        </Card>
      </div>

      <CambiarPasswordDialog
        open={cambiandoPassword !== null}
        usuario={cambiandoPassword}
        onClose={() => setCambiandoPassword(null)}
        onCambiado={(nombre) => {
          setCambiandoPassword(null)
          setAviso(`La contraseña de ${nombre} fue actualizada.`)
          setFormError(null)
        }}
      />
    </>
  )
}
