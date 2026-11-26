import type { IconName } from '@/shared/ui/icons'

export interface NavItem {
  label: string
  href: string
  icon: IconName
}

export interface NavGroup {
  titulo: string
  items: NavItem[]
  /** Los grupos de documentos se muestran como submenú desplegable. */
  colapsable?: boolean
}

export const NAVEGACION: NavGroup[] = [
  {
    titulo: 'Operación',
    items: [
      { label: 'Panel', href: '/', icon: 'home' },
      { label: 'Ventas', href: '/ventas', icon: 'wallet' },
      { label: 'Comprobantes', href: '/comprobantes', icon: 'file-text' },
      { label: 'Clientes', href: '/clientes', icon: 'users' },
      { label: 'Productos', href: '/productos', icon: 'tag' },
      { label: 'Reportes', href: '/reportes', icon: 'chart' },
    ],
  },
  {
    titulo: 'Documentos',
    colapsable: true,
    items: [
      { label: 'Proformas y pedidos', href: '/documentos', icon: 'clipboard' },
      { label: 'Guías de remisión', href: '/guias', icon: 'truck' },
      { label: 'Resúmenes y bajas', href: '/resumenes', icon: 'file-text' },
    ],
  },
  {
    titulo: 'Sistema',
    items: [{ label: 'Configuración SUNAT', href: '/configuracion', icon: 'cog' }],
  },
]

/** El maestro gestiona usuarios y consulta la bitácora; no entra a facturación. */
export const NAVEGACION_MAESTRO: NavGroup[] = [
  {
    titulo: 'Gestión',
    items: [
      { label: 'Usuarios y accesos', href: '/maestro', icon: 'users' },
      { label: 'Auditoría', href: '/auditoria', icon: 'shield' },
    ],
  },
]

export const TITULOS: Record<string, string> = {
  '/': 'Panel',
  '/maestro': 'Usuarios y accesos',
  '/sin-acceso': 'Sin acceso',
  '/ventas': 'Ventas',
  '/comprobantes': 'Comprobantes',
  '/comprobantes/nuevo': 'Nuevo comprobante',
  '/clientes': 'Clientes',
  '/productos': 'Productos',
  '/reportes': 'Reporte de ventas',
  '/documentos': 'Proformas y pedidos',
  '/documentos/nuevo': 'Nuevo documento de venta',
  '/guias': 'Guías de remisión',
  '/guias/nuevo': 'Nueva guía de remisión',
  '/resumenes': 'Resúmenes y bajas',
  '/resumenes/nuevo': 'Nuevo resumen SUNAT',
  '/auditoria': 'Auditoría',
  '/configuracion': 'Configuración SUNAT',
}
