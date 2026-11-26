# Mueblería José · Frontend

Dashboard React 19 + Vite 8 + Tailwind 4, basado en la capa visual de `dojo-gaman-peru`.
El backend vive en el proyecto hermano `../muebleria-jose-backend`.

## Puesta en marcha

```powershell
cd muebleria-jose-frontend
npm install
npm run dev       # http://localhost:5173
npm run build     # verifica tipos y genera dist/
npm run preview   # sirve dist/
```

Vite proxya `/api` a `http://localhost:3001`, así que hay que arrancar el backend en paralelo.
No hay URL de API escrita a mano en el código.

## Estructura

```
src/
  modules/      autenticación, usuarios, panel, ventas, comprobantes, clientes, productos,
                reportes, documentos, guías, resumenes, detracciones, configuración
  shared/       layout, UI base, contextos, servicios, tipos, integraciones y enlaces
  routes/       AppRoutes.tsx
  styles/       theme.css, typography.css y globals.css (tokens de marca)
```

Los componentes base (Button, DataTable, Card, Badge, Alert, StatCard, TextField) se copiaron
del dashboard de dojo y se adaptaron para quitar dependencias de permisos ajenas. El acento de
marca es azul institucional (`--color-brand-500: #2563eb`).

## Pantallas

- **Login:** fondo blanco (`bg-primary`) con trama de puntos negros tenues, columna centrada de 360 px,
  marca MJ azul, formulario dentro de un cuadro con borde y sombra, campos de 16 px, selector de tema,
  validaciones en línea, “Recordarme 30 días” y
  contador de intentos. Sin foto de fondo ni botón de Google. Autenticación real contra el backend, con sesión JWT de 8 horas,
  5 intentos fallidos y página `/bloqueado` con cuenta regresiva. Los usuarios iniciales se definen
  en el seed del backend; sus credenciales viven solo en el entorno del servidor. El maestro entra
  directamente a `/maestro`.
- **Maestro:** panel `/maestro` con formulario de alta y lista de cuentas. Crea vendedores, les da o
  quita **acceso a facturación** y activa/desactiva cuentas. No ve Ventas, Comprobantes, Clientes,
  Productos ni Configuración; el buscador global tampoco aparece para ese rol. Los vendedores sin
  permiso ven `/sin-acceso` hasta que el maestro se lo habilita.
- **Panel:** ocho KPIs compactos al estilo dojo (ventas, ticket promedio, IGV, comprobantes, facturas,
  boletas, pendientes SUNAT y clientes activos) en rejilla de 2 columnas en móvil y 4 desde `md`, con
  skeletons y líneas de detalle; debajo, ventas por mes, accesos rápidos y últimos comprobantes. Ocupa
  todo el ancho, igual que `/ventas`.
- **Ventas:** cabecera con razón social, dirección y RUC del local; selector **Boleta (B001) /
  Factura (F001)** en el mismo formulario, cliente con autocompletado RENIEC/RUC (la factura fuerza
  RUC), datos de la venta y tabla de ítems con IGV por línea. El botón **Vista previa** abre el
  ticket POS 80 de demostración con el tipo elegido. **Emitir boleta / Emitir factura** guarda cliente
  y productos si hace falta, crea el comprobante con el proveedor configurado y abre su ticket real.
  Validación en línea de documento, nombre, teléfono, correo, ubigeo, fechas, moneda/tipo de cambio y
  cada ítem (código, descripción, unidad, cantidad, precio e IGV); los errores se resaltan y se resumen
  antes de enviar. El precio y el IGV editados en cada línea ganan sobre el catálogo, y la moneda/tipo
  de cambio elegidos se guardan y se muestran en el ticket POS 80 del comprobante emitido.
  El selector **Detracción** trae los 35 códigos de `DETRACCIONES.DBF`; al elegir uno distinto de
  `000`, el resumen y la vista previa muestran el monto calculado y el ticket del comprobante lo
  conserva. El backend valida el código y calcula el importe; no se genera ningún pago ni depósito.
- **Marco:** sidebar plegable al estilo dojo (hover temporal y botón contraer en escritorio, drawer en
  móvil) y encabezado con menú de perfil del usuario autenticado, tema, accesos según rol y **Cerrar
  sesión**. El admin ve además “Usuarios y accesos” y “Auditoría”; el maestro solo ve el enlace de
  usuarios. `/`, `/ventas`, `/comprobantes`, `/clientes`, `/documentos`, `/productos` y `/reportes`
  ocupan todo el ancho; el resto del dashboard mantiene su centro.
- **Búsqueda global:** se recuperó el `GlobalSearch` histórico de dojo (`src/shared/layout/GlobalSearch.tsx`),
  adaptado a comprobantes, clientes y productos. Se abre con `Ctrl/⌘+K` o con el icono de lupa; muestra
  una paleta con resultados por tipo y navega al detalle del comprobante o al listado filtrado
  (`/clientes?q=…`, `/productos?q=…`). En escritorio es un input inline con badge `⌘ K`; en móvil se
  despliega como overlay con input de 16 px. Las fuentes se cargan en paralelo con `useFuentesDatos`
  (`Promise.allSettled`), igual que en dojo.
- **Comprobantes:** listado a todo el ancho con búsqueda por cliente/documento, filtros por tipo y
  estado (incluye notas de crédito/débito y el documento al que afectan), orden por fecha reciente,
  tabla compacta de filas alternadas, selector de filas por página y tarjetas en móvil.
- **Gestión del comprobante:** en el detalle, **Consultar CDR**, **Reenviar**, **Nota de crédito**,
  **Nota de débito** y **Anular** (con motivo). Las notas se emiten sobre un comprobante emitido o
  aceptado, ajustando cantidades desde sus ítems; las anulaciones solo aplican a esos estados y no se
  pueden repetir. Con el proveedor `local` CDR, bajas y reenvíos son simulaciones: la respuesta dice
  explícitamente que no hubo contacto con SUNAT. El ticket POS 80 muestra el documento afectado, el
  motivo de la nota y el estado ANULADO. El ticket muestra además el **QR de SICAP**, servido como
  `{ dataUrl }` por `GET /api/comprobantes/:id/qr` (una etiqueta `<img>` no envía el Bearer). Es el
  mismo texto decodificado de los PDF reales de SICAP, con `Factura No.` también en boletas; no es
  un código SUNAT ni un Code128. **Descargar PDF** obtiene el ticket POS 80 generado en el backend
  desde `GET /api/comprobantes/:id/pdf`, con el QR, el total en letras y la detracción. Los endpoints
  de gestión son `POST /api/comprobantes/:id/anular`, `GET /api/comprobantes/:id/cdr` y
  `POST /api/comprobantes/:id/reenviar`; el maestro queda fuera por el middleware de facturación.
- **Nuevo comprobante:** selección de cliente y productos; totales calculados en el servidor.
- **Clientes:** catálogo a todo el ancho con búsqueda local, orden por nombre, tabla compacta de filas
  alternadas, selector de filas por página, tarjetas en móvil y botón **Ver detalles** con la ficha
  completa (documento, dirección, ubigeo, teléfono y correo).
- **Productos:** catálogo a todo el ancho con barra de filtros alineada (texto, IGV y stock), botón
  **Nuevo producto** con modal responsive que llama a `POST /api/productos`, y tabla con filas
  alternas, padding horizontal y scroll en pantallas estrechas. No se aplica `.prose` al listado:
  sus márgenes desalineaban las cabeceras y las tarjetas.
- **Reporte de ventas:** `/reportes` con rango `desde`/`hasta` (por defecto mes actual en hora Lima),
  cuatro KPIs, detalle por comprobante, totales por día, producto y tipo. Solo cuentan `EMITIDO` y
  `ACEPTADO`: las notas de crédito descuentan, las de débito suman y los anulados se informan aparte;
  los importes USD se convierten a PEN por su tipo de cambio. **Exportar Excel** descarga un `.xlsx`
  real con cinco hojas (Resumen, Detalle, Por día, Por tipo, Por producto) generado en el backend con
  JSZip, sin librerías nuevas. **Exportar PDF** descarga un A4 apaisado con las mismas cinco secciones
  y pie de página, generado en el backend sin librerías de PDF en el navegador. Endpoints:
  `GET /api/reportes/ventas?desde=…&hasta=…`, `GET /api/reportes/ventas/excel?desde=…&hasta=…` y
  `GET /api/reportes/ventas/pdf?desde=…&hasta=…`, todos con token y bloqueados para maestro. El rango
  inválido devuelve 400 y las descargas usan `reporte-ventas-DESDE-HASTA.xlsx` o `.pdf`.
- **Proformas y pedidos:** `/documentos` a todo el ancho, con series `C001`/`P001`, filtros por tipo
  y búsqueda, orden por fecha reciente, tabla compacta de filas alternadas, selector de filas por
  página, tarjetas en móvil y botón **Ver detalles**. La proforma se entrega en ticket POS 80; cuando
  vuelve y decide comprar, se aprueba y se convierte a boleta o factura.
  El formulario solo pide un **cliente nuevo** (tipo, número, razón social y dirección), que se crea
  en el catálogo al guardar; ya no hay selector de clientes existentes. El botón **Consultar RENIEC**
  valida DNI/CE/RUC en el navegador y autocompleta nombre, dirección y ubigeo mediante
  `GET /api/reniec/{dni|cee|ruc}/{numero}`; el token del proveedor queda solo en el `.env` del backend.
  Cada línea permite **elegir
  un producto del catálogo** o **Escribir texto**: en modo texto solo se piden el texto y su importe,
  sin código, unidad ni descripción estructurada, y no se crea ningún producto. Guarda además fechas
  de emisión/vencimiento/entrega, solicitado por y observación; el servidor recalcula subtotal, IGV y
  total en centavos (las líneas de texto se graban con `productoId` nulo).
  Estados `PENDIENTE → APROBADO|RECHAZADO`, con retorno a pendiente y conversión terminal a
  comprobante. Solo se puede convertir un documento aprobado: se elige boleta o factura según el
  documento del cliente, se reutiliza `crearComprobante` y se guarda la referencia cruzada. Si el
  documento tiene líneas de texto, la conversión se bloquea con un aviso (409) y el detalle oculta el
  botón; se puede imprimir y entregar igual. El
  formulario tiene **Vista previa POS 80** antes de guardar (sin numerar, sin guardar y sin envío a
  SUNAT), con opción de imprimir/guardar PDF; la vista de detalle usa el mismo ticket POS 80, ya
  numerado y con pie de «documento guardado».
  Endpoints: `GET/POST /api/documentos`, `GET /api/documentos/:id`,
  `PATCH /api/documentos/:id/estado` y `POST /api/documentos/:id/convertir`.
- **Guías de remisión:** `/guias` con serie `T001`, motivo, modalidad público/privado (placa y
  conductor obligatorios en público), direcciones y ubigeos de partida/llegada, peso, comprobante
  asociado opcional y productos. Se emiten localmente, sin envío a SUNAT; se pueden anular con motivo
  y conservan `motivoAnulacion`/`anuladoEn`. La vista de detalle también imprime en A4. Endpoints:
  `GET/POST /api/guias`, `GET /api/guias/:id` y `POST /api/guias/:id/anular`.
  Los correlativos no tributarios usan la tabla `Secuencia` con incremento atómico. Maestro sigue
  fuera de los módulos de facturación por el middleware existente.
- **Resúmenes y bajas:** `/resumenes` con pestañas para resumen diario (`RC001`) y comunicación de
  baja (`RA001`). El formulario permite elegir la fecha y ver los comprobantes que se incluirán:
  boletas vigentes y notas sobre boleta aún no resumidas, o comprobantes anulados seleccionables.
  El servidor calcula los importes desde los comprobantes, evita duplicados y devuelve un registro
  `ACEPTADO` con mensaje explícito de modo local. El detalle es imprimible en A4 y el botón
  **Reenviar (simulado)** aumenta el contador sin contactar a SUNAT. Endpoints:
  `GET /api/resumenes`, `GET /api/resumenes/:id`, `POST /api/resumenes/diario`,
  `POST /api/resumenes/bajas` y `POST /api/resumenes/:id/reenviar`.
- **Detracciones:** catálogo de 35 códigos/tasas de SICAP servido por `GET /api/detracciones`. Se
  elige en el formulario de Ventas antes de emitir; el servidor valida `detraccionCodigo`, guarda la
  tasa y el monto en centavos, y el ticket del comprobante muestra la detracción aplicada. No hay
  constancia de depósito ni pago bancario.
- **Configuración SUNAT:** emisor, proveedor, ambiente y series activas.
- **Auditoría:** `/auditoria` solo para `ADMIN`. Lista la bitácora real de operaciones con filtros por
  usuario, módulo, acción, resultado y período, más paginación en el servidor. El backend registra
  automáticamente altas, cambios, anulaciones, conversiones, reenvíos y accesos denegados; también
  guarda ingreso, fallos, bloqueos y cierre de sesión. Cada fila muestra fecha y hora de Lima,
  usuario, acción, entidad, código HTTP, ruta e IP; el botón **Ver detalle** abre el JSON saneado con
  solicitud, consulta y respuesta. No guarda contraseñas ni tokens. Endpoint: `GET /api/auditoria`.

Sin base de datos las pantallas muestran un aviso de error; el backend debe estar corriendo.
