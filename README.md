# Demo de facturación · Frontend

React 19, Vite 8 y Tailwind 4. Es la interfaz de una demo pública independiente; el backend está en `../dashboard-fact-demo-backend` y se despliega aparte en Render.

## Puesta en marcha

```powershell
cd dashboard-fact-demo-frontend
npm install
npm run dev       # http://localhost:5173
npm run build     # verifica tipos y genera dist/
npm run preview   # sirve dist/
```

En desarrollo, Vite redirige `/api` a `http://localhost:3001`. En producción, `vercel.json` reescribe
`/api/(.*)` al backend demo. No hay URL de API escrita en los componentes.

## Estructura

```
src/
  modules/      autenticación, usuarios, panel, ventas, comprobantes, clientes, productos,
                reportes, documentos, guías, resumenes, detracciones, configuración
  shared/       layout, UI base, contextos, servicios, tipos e integraciones
  routes/       AppRoutes.tsx
  styles/       theme.css, typography.css y globals.css
```

## Pantallas

- Login: fondo claro, marca de la demo, selector de tema, campos de 16 px en móvil, validaciones en línea y sesión JWT de 8 horas. Las credenciales iniciales se definen solo en el entorno del backend.
- Maestro: alta de usuarios, control de `puedeFacturar` y auditoría. No emite comprobantes.
- Panel: KPIs del mes, ventas por mes, accesos rápidos y últimos comprobantes, con skeletons.
- Ventas: boleta o factura al contado, cliente con autocompletado opcional RENIEC/RUC, ítems con
  IGV por línea, detracciones y vista previa del ticket POS 80.
- Comprobantes: listado y detalle con descargas de XML/ZIP/CDR, consulta de CDR, reenvío, notas y
  anulación. En modo local son simulaciones sin validez tributaria.
- Documentos: cotizaciones/proformas y pedidos/encargos, sin envío a SUNAT ni reserva de stock.
- Guías: formulario de traslado. El despliegue demo lo tiene desactivado.
- Reportes: exportaciones PDF y Excel que respetan filtros y orden; Clientes y Productos conservan CSV.
- Configuración: estado de integraciones y almacenamiento, sin secretos.

Las páginas principales usan todo el ancho (`w-full px-4 lg:px-8`). La interfaz se probó a 320 px y no
presenta desbordes horizontales; los modales caben en pantallas pequeñas. Los skeletons incluyen
`role="status"`, texto `sr-only` y barra de progreso superior.

## Autenticación y roles

- `ADMIN`: acceso total excepto gestión de usuarios.
- `MAESTRO`: usuarios, accesos y auditoría; no factura y no puede cambiar su contraseña.
- `VENDEDOR`: factura solo si tiene el permiso habilitado.

El token queda en el navegador y viaja como Bearer a `/api`. Cada petición valida la sesión.
