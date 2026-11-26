import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import { useSidebar } from '@/context/SidebarContext'
import { TITULOS } from '@/shared/navigation/navigation'
import { AvatarPerfil } from '@/shared/ui/AvatarPerfil'
import { Icon } from '@/shared/ui/icons'
import { cn } from '@/shared/utils/cn'
import { GlobalSearch } from './GlobalSearch'

function etiquetaRol(rol: string | undefined): string {
  if (rol === 'ADMIN') return 'Administrador'
  if (rol === 'MAESTRO') return 'Maestro'
  if (rol === 'VENDEDOR') return 'Vendedor'
  return 'Usuario'
}

export function Navbar() {
  const { theme, toggleTheme } = useTheme()
  const { user, logout } = useAuth()
  const { isMobileOpen, toggleSidebar, toggleMobileSidebar } = useSidebar()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return

    function handleClickOutside(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false)
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setMenuOpen(false)
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [menuOpen])

  function handleToggleSidebar() {
    if (window.innerWidth >= 1280) toggleSidebar()
    else toggleMobileSidebar()
  }

  const titulo =
    Object.keys(TITULOS)
      .filter((ruta) => (ruta === '/' ? pathname === '/' : pathname.startsWith(ruta)))
      .sort((a, b) => b.length - a.length)[0] ?? 'Panel'

  const menuItem =
    'group flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-secondary transition-colors hover:bg-secondary hover:text-primary'
  const iconButton =
    'flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-lg bg-primary text-secondary shadow-xs ring-1 ring-primary ring-inset outline-focus-ring transition-colors hover:bg-secondary hover:text-primary sm:size-10'
  const iconButtonPlano =
    'flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-lg text-secondary outline-focus-ring transition-colors hover:text-primary sm:size-10'

  return (
    <header className="sticky top-0 z-30 w-full border-b border-secondary bg-primary">
      <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <button
            type="button"
            onClick={handleToggleSidebar}
            aria-label={isMobileOpen ? 'Cerrar menú lateral' : 'Abrir menú lateral'}
            className={cn(iconButton, 'shrink-0 xl:hidden')}
          >
            <Icon name={isMobileOpen ? 'close' : 'menu'} className="size-5 sm:size-6" />
          </button>

          {user?.rol !== 'MAESTRO' && <GlobalSearch />}

          <p className="min-w-0 flex-1 truncate text-md font-semibold text-primary">
            {TITULOS[titulo]}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={(event) => {
              const rect = event.currentTarget.getBoundingClientRect()
              toggleTheme({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 })
            }}
            className={iconButtonPlano}
            aria-label={theme === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
          >
            <Icon name={theme === 'dark' ? 'sun' : 'moon'} className="size-5 sm:size-6" />
          </button>

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              aria-label={`Perfil de ${user?.nombre ?? 'Mueblería José'}`}
              className="flex cursor-pointer items-center rounded-full text-primary outline-focus-ring"
            >
              <AvatarPerfil
                nombre={user?.usuario ?? user?.nombre ?? 'Mueblería José'}
                etiqueta={`Perfil de ${user?.nombre ?? 'Mueblería José'}`}
                tamano={40}
                className="me-1 rounded-full ring-1 ring-secondary ring-inset [&>svg]:size-8 sm:me-3 sm:[&>svg]:size-10"
              />
              <span className="me-1 hidden max-w-32 truncate text-sm font-medium sm:block">
                {user?.nombre ?? 'Mueblería José'}
              </span>
              <Icon
                name="chevron-down"
                className={cn(
                  'size-4 text-fg-tertiary transition-transform duration-200 sm:size-5',
                  menuOpen && 'rotate-180',
                )}
              />
            </button>

            {menuOpen && (
              <div
                role="menu"
                className="absolute end-0 z-50 mt-3 w-[min(20rem,calc(100vw-2rem))] origin-top-right rounded-xl bg-primary p-2 shadow-xl ring-1 ring-tertiary ring-inset animate-in fade-in slide-in-from-top-2 duration-150"
              >
                <div className="flex items-center gap-3 rounded-lg bg-secondary p-3">
                  <AvatarPerfil
                    nombre={user?.usuario ?? user?.nombre ?? 'Mueblería José'}
                    etiqueta={`Perfil de ${user?.nombre ?? 'Mueblería José'}`}
                    tamano={48}
                  />
                  <div className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-primary">
                      {user?.nombre ?? 'Mueblería José'}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-tertiary">
                      @{user?.usuario ?? 'admin'}
                    </span>
                    <span className="mt-2 inline-flex rounded-full bg-brand-secondary px-2 py-0.5 text-xs font-medium text-brand-primary">
                      {etiquetaRol(user?.rol)}
                    </span>
                  </div>
                </div>

                {user?.rol !== 'MAESTRO' && (
                  <>
                    <Link to="/configuracion" onClick={() => setMenuOpen(false)} className={cn(menuItem, 'mt-2 w-full')}>
                      <Icon name="cog" className="size-5 text-fg-quaternary" />
                      Configuración SUNAT
                    </Link>
                    <Link to="/" onClick={() => setMenuOpen(false)} className={cn(menuItem, 'w-full')}>
                      <Icon name="home" className="size-5 text-fg-quaternary" />
                      Volver al panel
                    </Link>
                  </>
                )}
                {user?.rol === 'MAESTRO' && (
                  <>
                    <Link to="/maestro" onClick={() => setMenuOpen(false)} className={cn(menuItem, 'mt-2 w-full')}>
                      <Icon name="users" className="size-5 text-fg-quaternary" />
                      Usuarios y accesos
                    </Link>
                    <Link to="/auditoria" onClick={() => setMenuOpen(false)} className={cn(menuItem, 'w-full')}>
                      <Icon name="shield" className="size-5 text-fg-quaternary" />
                      Auditoría
                    </Link>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => {
                    logout()
                    setMenuOpen(false)
                    navigate('/login', { replace: true })
                  }}
                  className={cn(menuItem, 'w-full')}
                >
                  <Icon name="logout" className="size-5 text-fg-quaternary" />
                  Cerrar sesión
                </button>

                <div className="mt-2 border-t border-secondary px-3 pt-2 text-xs text-tertiary">
                  Sesión segura · token de 8 horas
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
