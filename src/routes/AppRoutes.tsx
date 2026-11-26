import { Navigate, Route, Routes } from 'react-router-dom'
import { AccesoDenegadoPage } from '@/modules/autenticacion/pages/AccesoDenegadoPage'
import { LoginPage } from '@/modules/autenticacion/pages/LoginPage'
import { LockedPage } from '@/modules/autenticacion/pages/LockedPage'
import { MaestroPage } from '@/modules/usuarios/pages/MaestroPage'
import { PanelPage } from '@/modules/panel/pages/PanelPage'
import { VentasPage } from '@/modules/ventas/pages/VentasPage'
import { ComprobantesPage } from '@/modules/comprobantes/pages/ComprobantesPage'
import { ComprobanteDetallePage } from '@/modules/comprobantes/pages/ComprobanteDetallePage'
import { NuevoComprobantePage } from '@/modules/comprobantes/pages/NuevoComprobantePage'
import { ClientesPage } from '@/modules/clientes/pages/ClientesPage'
import { ProductosPage } from '@/modules/productos/pages/ProductosPage'
import { ReportesPage } from '@/modules/reportes/pages/ReportesPage'
import { DocumentosPage } from '@/modules/documentos/pages/DocumentosPage'
import { NuevoDocumentoPage } from '@/modules/documentos/pages/NuevoDocumentoPage'
import { DocumentoDetallePage } from '@/modules/documentos/pages/DocumentoDetallePage'
import { GuiasPage } from '@/modules/guias/pages/GuiasPage'
import { NuevaGuiaPage } from '@/modules/guias/pages/NuevaGuiaPage'
import { GuiaDetallePage } from '@/modules/guias/pages/GuiaDetallePage'
import { ResumenesPage } from '@/modules/resumenes/pages/ResumenesPage'
import { NuevoResumenPage } from '@/modules/resumenes/pages/NuevoResumenPage'
import { ResumenDetallePage } from '@/modules/resumenes/pages/ResumenDetallePage'
import { ConfiguracionPage } from '@/modules/configuracion/pages/ConfiguracionPage'
import { AuditoriaPage } from '@/modules/auditoria/pages/AuditoriaPage'
import { RequireAuth } from '@/shared/guards/RequireAuth'
import { RequireFacturacion } from '@/shared/guards/RequireFacturacion'
import { RequireRole } from '@/shared/guards/RequireRole'
import { DashboardLayout } from '@/shared/layout/DashboardLayout'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/bloqueado" element={<LockedPage />} />

      <Route element={<RequireAuth />}>
        <Route element={<DashboardLayout />}>
          <Route element={<RequireRole roles={['MAESTRO']} />}>
            <Route path="maestro" element={<MaestroPage />} />
          </Route>
          <Route path="sin-acceso" element={<AccesoDenegadoPage />} />

          <Route element={<RequireRole roles={['ADMIN', 'MAESTRO']} />}>
            <Route path="auditoria" element={<AuditoriaPage />} />
          </Route>

          <Route element={<RequireFacturacion />}>
            <Route index element={<PanelPage />} />
            <Route path="ventas" element={<VentasPage />} />
            <Route path="comprobantes" element={<ComprobantesPage />} />
            <Route path="comprobantes/nuevo" element={<NuevoComprobantePage />} />
            <Route path="comprobantes/:id" element={<ComprobanteDetallePage />} />
            <Route path="clientes" element={<ClientesPage />} />
            <Route path="productos" element={<ProductosPage />} />
            <Route path="reportes" element={<ReportesPage />} />
            <Route path="documentos" element={<DocumentosPage />} />
            <Route path="documentos/nuevo" element={<NuevoDocumentoPage />} />
            <Route path="documentos/:id" element={<DocumentoDetallePage />} />
            <Route path="guias" element={<GuiasPage />} />
            <Route path="guias/nuevo" element={<NuevaGuiaPage />} />
            <Route path="guias/:id" element={<GuiaDetallePage />} />
            <Route path="resumenes" element={<ResumenesPage />} />
            <Route path="resumenes/nuevo" element={<NuevoResumenPage />} />
            <Route path="resumenes/:id" element={<ResumenDetallePage />} />
            <Route path="configuracion" element={<ConfiguracionPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Route>
    </Routes>
  )
}
