import { Outlet, useLocation } from 'react-router-dom'
import { SidebarProvider, useSidebar } from '@/context/SidebarContext'
import { cn } from '@/shared/utils/cn'
import { Backdrop } from './Backdrop'
import { Navbar } from './Navbar'
import { Sidebar } from './Sidebar'

function LayoutContent() {
  const { pathname } = useLocation()
  const { isExpanded, isHovered, isMobileOpen } = useSidebar()
  // Panel, Ventas, Comprobantes, Clientes, Documentos, Guías, Productos, Reportes,
  // Resúmenes, Auditoría y Configuración usan todo el ancho; cada módulo aplica su padding.
  const anchoCompleto =
    pathname === '/' ||
    pathname.startsWith('/ventas') ||
    pathname.startsWith('/comprobantes') ||
    pathname.startsWith('/clientes') ||
    pathname.startsWith('/documentos') ||
    pathname.startsWith('/guias') ||
    pathname.startsWith('/productos') ||
    pathname.startsWith('/reportes') ||
    pathname.startsWith('/resumenes') ||
    pathname.startsWith('/auditoria') ||
    pathname.startsWith('/configuracion')

  return (
    <div className="min-h-dvh xl:flex">
      <Sidebar />
      <Backdrop />

      <div
        className={cn(
          'min-w-0 flex-1 transition-[margin] duration-300 ease-in-out',
          isExpanded || isHovered ? 'xl:ms-[292px]' : 'xl:ms-22',
          isMobileOpen && 'ms-0',
        )}
      >
        <Navbar />
        <main
          className={cn(
            'min-w-0 flex-1 bg-primary',
            pathname === '/'
              ? 'max-w-none pt-8 pb-12'
              : pathname.startsWith('/ventas') ||
                  pathname.startsWith('/comprobantes') ||
                  pathname.startsWith('/clientes') ||
                  pathname.startsWith('/documentos') ||
                  pathname.startsWith('/guias') ||
                  pathname.startsWith('/productos') ||
                  pathname.startsWith('/reportes') ||
                  pathname.startsWith('/resumenes') ||
                  pathname.startsWith('/auditoria') ||
                  pathname.startsWith('/configuracion')
                ? 'max-w-none pt-8 pb-16 lg:pt-12 lg:pb-24'
                : cn(
                    'w-full px-4 py-6 sm:px-6 lg:px-8',
                    anchoCompleto ? 'max-w-none' : 'mx-auto max-w-7xl',
                  ),
          )}
        >
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export function DashboardLayout() {
  return (
    <SidebarProvider>
      <LayoutContent />
    </SidebarProvider>
  )
}
