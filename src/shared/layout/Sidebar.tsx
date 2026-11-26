import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useSidebar } from '@/context/SidebarContext'
import { Icon } from '@/shared/ui/icons'
import type { IconName } from '@/shared/ui/icons'
import { AvatarPerfil } from '@/shared/ui/AvatarPerfil'
import { Logo } from '@/shared/ui/Logo'
import {
  NAVEGACION,
  NAVEGACION_MAESTRO,
  type NavGroup,
  type NavItem,
} from '@/shared/navigation/navigation'
import { cn } from '@/shared/utils/cn'

export function Sidebar() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const {
    isExpanded,
    isMobileOpen,
    isHovered,
    setIsHovered,
    closeMobileSidebar,
    toggleSidebar,
  } = useSidebar()
  const [filtro, setFiltro] = useState('')
  const [menuAbierto, setMenuAbierto] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const showLabels = isExpanded || isHovered || isMobileOpen
  const collapsed = !showLabels

  useEffect(() => {
    if (!menuAbierto) return

    function handleClickOutside(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setMenuAbierto(false)
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setMenuAbierto(false)
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [menuAbierto])

  const navegacion = useMemo<NavGroup[]>(() => {
    if (user?.rol === 'MAESTRO') return NAVEGACION_MAESTRO
    if (user?.rol === 'ADMIN') {
      return NAVEGACION.map((grupo) =>
        grupo.titulo === 'Sistema'
          ? {
              ...grupo,
              items: [
                { label: 'Auditoría', href: '/auditoria', icon: 'shield' as IconName },
                ...grupo.items,
              ],
            }
          : grupo,
      )
    }
    return NAVEGACION
  }, [user?.rol])

  const grupos = useMemo(() => {
    const texto = filtro.trim().toLowerCase()
    if (!texto) return navegacion
    return navegacion
      .map((grupo) => ({
        ...grupo,
        items: grupo.items.filter((item) => item.label.toLowerCase().includes(texto)),
      }))
      .filter((grupo) => grupo.items.length > 0)
  }, [filtro, navegacion])

  function esActivo(href: string) {
    return href === '/' ? pathname === '/' : pathname.startsWith(href)
  }

  function cerrarAlNavegar() {
    setMenuAbierto(false)
    closeMobileSidebar()
  }

  function cerrarSesion() {
    logout()
    setMenuAbierto(false)
    navigate('/login', { replace: true })
  }

  function renderItem(item: NavItem, subitem = false) {
    const activo = esActivo(item.href)
    return (
      <li key={item.href} className={subitem ? 'py-0.25' : 'py-px'}>
        <Link
          to={item.href}
          onClick={cerrarAlNavegar}
          title={collapsed && !subitem ? item.label : undefined}
          aria-current={activo ? 'page' : undefined}
          className={itemClassName(activo, collapsed, subitem)}
        >
          {!subitem && <ItemIcon name={item.icon} active={activo} collapsed={collapsed} />}
          {showLabels && <span className="flex-1 truncate">{item.label}</span>}
        </Link>
      </li>
    )
  }

  return (
    <aside
      style={{ '--width': '276px' } as CSSProperties}
      className={cn(
        'no-scrollbar fixed inset-y-0 start-0 z-50 flex h-dvh w-[min(85vw,20rem)] max-w-[85vw] flex-col justify-between overflow-auto bg-primary pt-4 shadow-xs ring-secondary ring-inset transition-[width,transform] duration-300 ease-in-out',
        'xl:bottom-2 xl:start-2 xl:top-2 xl:h-auto xl:translate-x-0 xl:rounded-xl xl:ring-1',
        collapsed ? 'xl:w-18' : 'xl:w-(--width)',
        isMobileOpen ? 'translate-x-0' : '-translate-x-full',
      )}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      aria-label="Navegación principal"
    >
      <div className="flex flex-col gap-5 px-4 xl:px-5">
        <div className="flex h-6 w-max items-center justify-start overflow-visible">
          <Link
            to={user?.rol === 'MAESTRO' ? '/maestro' : '/'}
            onClick={cerrarAlNavegar}
            className="min-w-0"
          >
            <Logo compact={collapsed} size="sm" />
          </Link>
        </div>

        {showLabels && (
          <div className="group relative flex h-max w-full flex-col gap-1.5">
            <div className="group/input relative flex w-full flex-row place-content-center place-items-center rounded-lg bg-primary shadow-xs ring-1 ring-primary ring-inset">
              <Icon
                name="search"
                className="pointer-events-none absolute start-3 size-4 text-fg-quaternary"
              />
              <input
                type="search"
                value={filtro}
                onChange={(event) => setFiltro(event.target.value)}
                placeholder="Filtrar menú"
                aria-label="Filtrar menú"
                className="m-0 w-full bg-transparent px-3 py-2 ps-9 text-sm text-primary outline-hidden placeholder:text-placeholder"
              />
            </div>
          </div>
        )}
      </div>

      <nav className="no-scrollbar flex flex-1 flex-col overflow-y-auto" aria-label="Secciones">
        <ul className="flex flex-col px-4 pt-5 xl:px-5">
          {grupos.map((grupo, indice) => (
            <li key={grupo.titulo} className="flex flex-col">
              {indice > 0 && <hr className="my-2 h-px w-full border-none bg-border-secondary" />}
              {showLabels && (
                <p className="mb-1 px-2 text-[11px] font-semibold tracking-wide text-quaternary uppercase">
                  {grupo.titulo}
                </p>
              )}

              {grupo.colapsable && showLabels ? (
                <details open className="group/documentos py-0.25">
                  <summary className={cn(itemClassName(false, collapsed), 'list-none')}>
                    <ItemIcon name="file-text" active={false} collapsed={collapsed} />
                    <span className="flex-1 truncate">{grupo.titulo}</span>
                    <Icon
                      name="chevron-down"
                      className="ms-3 size-4 shrink-0 text-fg-quaternary transition-transform duration-200 group-open/documentos:rotate-180"
                    />
                  </summary>
                  <ul className="pb-1">{grupo.items.map((item) => renderItem(item, true))}</ul>
                </details>
              ) : (
                <ul className="flex flex-col">{grupo.items.map((item) => renderItem(item))}</ul>
              )}
            </li>
          ))}
          {grupos.length === 0 && showLabels && (
            <li className="px-2 py-6 text-center text-sm text-tertiary">
              Sin opciones para “{filtro}”.
            </li>
          )}
        </ul>
      </nav>

      <div ref={menuRef} className="mt-auto flex flex-col gap-2 px-2 py-4 xl:px-4 xl:py-4">
        {collapsed ? (
          <div className="flex justify-center">
            <AvatarPerfil
              nombre={user?.usuario ?? user?.nombre ?? 'Mueblería José'}
              etiqueta={`Perfil de ${user?.nombre ?? 'Mueblería José'}`}
              className="rounded-full ring-1 ring-secondary_alt"
              enLinea
            />
          </div>
        ) : (
          <div className="relative flex items-center gap-3 rounded-xl p-3 ring-1 ring-secondary ring-inset">
            <figure className="group flex min-w-0 flex-1 items-center gap-2">
              <AvatarPerfil
              nombre={user?.usuario ?? user?.nombre ?? 'Mueblería José'}
              etiqueta={`Perfil de ${user?.nombre ?? 'Mueblería José'}`}
              className="rounded-full ring-1 ring-secondary_alt"
              enLinea
            />
              <figcaption className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-primary">
                  {user?.nombre ?? 'Mueblería José'}
                </p>
                <p className="truncate text-sm text-tertiary">@{user?.usuario ?? 'admin'}</p>
              </figcaption>
            </figure>

            <button
              type="button"
              onClick={() => setMenuAbierto((abierto) => !abierto)}
              aria-label={menuAbierto ? 'Cerrar menú de usuario' : 'Abrir menú de usuario'}
              aria-expanded={menuAbierto}
              className="absolute top-2 right-2 flex cursor-pointer items-center justify-center rounded-md p-1.5 text-fg-quaternary outline-focus-ring transition duration-100 ease-linear hover:bg-primary_hover hover:text-fg-quaternary_hover focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              <Icon
                name="chevron-down"
                className={cn(
                  'size-4 shrink-0 transition-transform duration-200',
                  menuAbierto && 'rotate-180',
                )}
              />
            </button>

            {menuAbierto && (
              <div
                role="menu"
                className="absolute bottom-full end-0 z-50 mb-2 w-[min(16rem,calc(100vw-4rem))] rounded-xl bg-primary p-2 shadow-xl ring-1 ring-tertiary ring-inset"
              >
                {user?.rol !== 'MAESTRO' && (
                  <Link to="/configuracion" onClick={cerrarAlNavegar} className={menuItemClassName}>
                    <Icon name="cog" className="size-5 text-fg-quaternary" />
                    Configuración SUNAT
                  </Link>
                )}
                {user?.rol === 'MAESTRO' && (
                  <>
                    <Link to="/maestro" onClick={cerrarAlNavegar} className={menuItemClassName}>
                      <Icon name="users" className="size-5 text-fg-quaternary" />
                      Usuarios y accesos
                    </Link>
                    <Link to="/auditoria" onClick={cerrarAlNavegar} className={menuItemClassName}>
                      <Icon name="shield" className="size-5 text-fg-quaternary" />
                      Auditoría
                    </Link>
                  </>
                )}
                <button type="button" onClick={cerrarSesion} className={cn(menuItemClassName, 'w-full')}>
                  <Icon name="logout" className="size-5 text-fg-quaternary" />
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={() => {
            setIsHovered(false)
            toggleSidebar()
          }}
          title={collapsed ? 'Expandir menú' : undefined}
          aria-label={isExpanded ? 'Contraer menú' : 'Expandir menú'}
          className={cn(itemClassName(false, collapsed), 'hidden xl:flex')}
        >
          <span
            className={cn(
              'mr-2 size-5 shrink-0 text-fg-quaternary group-hover/item:text-fg-quaternary_hover',
              collapsed && 'xl:mr-0',
            )}
          >
            <Icon
              name="arrow-left"
              className={cn('size-full transition-transform duration-200', !isExpanded && 'rotate-180')}
            />
          </span>
          {showLabels && (
            <span className="flex-1 truncate text-left">
              {isExpanded ? 'Contraer menú' : 'Fijar menú abierto'}
            </span>
          )}
        </button>
      </div>
    </aside>
  )
}

const menuItemClassName =
  'group flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-secondary transition-colors hover:bg-primary_hover hover:text-secondary_hover'

function itemClassName(active: boolean, collapsed: boolean, subitem = false) {
  return cn(
    'group/item relative flex max-h-9 w-full cursor-pointer items-center rounded-md text-sm font-semibold transition duration-100 ease-linear select-none outline-focus-ring focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-2',
    subitem ? 'py-2 pe-3 ps-10' : 'p-2',
    collapsed && 'xl:justify-center xl:px-2',
    active
      ? 'bg-secondary text-secondary_hover hover:bg-secondary_hover'
      : 'bg-primary text-secondary hover:bg-primary_hover hover:text-secondary_hover',
  )
}

function ItemIcon({ name, active, collapsed }: { name: IconName; active: boolean; collapsed: boolean }) {
  return (
    <span
      className={cn(
        'mr-2 size-5 shrink-0 text-fg-quaternary transition-inherit-all group-hover/item:text-fg-quaternary_hover',
        active && 'text-fg-secondary',
        collapsed && 'xl:mr-0',
      )}
    >
      <Icon name={name} className="size-full" />
    </span>
  )
}
