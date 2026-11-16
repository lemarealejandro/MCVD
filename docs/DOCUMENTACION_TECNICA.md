# ClinicPlus / MCVD — Documentación técnica

Fecha de corte: 2026-11-16. Documenta el estado real del código en `src/` a esa fecha, y al final, qué falta para vender el sistema a varias clínicas, cada una con su propio acceso y datos aislados.

Escrito para: desarrollo y para quien evalúe la viabilidad técnica del producto.

---

## 1. Resumen ejecutivo

- Es una **aplicación web de una sola página (SPA)** en React 19 + Vite 8, desplegable como sitio estático (configuración de Vercel con reescritura a `index.html`).
- **No tiene backend.** Todos los datos viven en el `localStorage` del navegador. No hay base de datos, ni API propia, ni sincronización entre dispositivos.
- **No tiene multi-tenant.** Existe un único acceso de administrador (variables de entorno) y una cuenta secundaria de "primer uso". Ambas comparten el mismo origen del navegador.
- La autenticación es **solo del lado del cliente**: el hash SHA-256 de la contraseña se compara en el navegador. El propio código lo advierte en `src/utils/auth.js`: no es seguridad real.
- Por lo tanto, **hoy no puede venderse a clínicas distintas con datos separados y login propio**. Es un prototipo funcional de un solo consultorio. La sección 9 detalla lo necesario para llegar a un producto multi-clínica.

---

## 2. Stack tecnológico

| Capa | Tecnología | Versión / nota |
|---|---|---|
| UI | React | `^19.2.4` |
| Build | Vite | `^8.0.1` |
| Enrutado | react-router-dom | `^7.16.0` (BrowserRouter) |
| Iconos | lucide-react | `^0.577.0` |
| Animación | framer-motion | `^12.38.0` |
| Arrastrar y soltar | @dnd-kit/core, sortable, utilities | `^6.3.1`, `^10.0.0`, `^3.2.2` |
| Firma digital | react-signature-canvas | `^1.1.0-alpha.2` (prerelease) |
| PDF | jspdf `^4.2.1`, html2canvas `^1.4.1`, html2pdf.js `^0.14.0` | Presupuesto: html2canvas + jsPDF. Informes: html2pdf.js |
| Correo | @emailjs/browser | `^5.0.3`, envío desde el navegador |
| Estilos | Tailwind vía `@tailwindcss/postcss` (devDependency), CSS propio en `src/index.css` y estilos inline en componentes | Convivencia de ambos enfoques |
| Lint | ESLint 9 + react-hooks + react-refresh | `npm run lint` |

Scripts (`package.json`): `dev`, `build`, `lint`, `preview`.

**Control de versiones:** el directorio no tiene commits todavía. Todos los archivos aparecen como no rastreados (`git status`). Antes de cualquier venta conviene inicializar el historial.

---

## 3. Arquitectura actual

```
Navegador (SPA)
 ├─ Login (SHA-256 en cliente) ──► sessionStorage["clinicplus_session"] = "admin" | "setup"
 ├─ Rutas /admin/* (RequireAuth)
 │    ├─ AdminLayout: carga estado persistente y lo pasa por Outlet context
 │    └─ Páginas: lectura/escritura en localStorage vía usePersistentState
 ├─ Ruta pública /paciente/ficha/:patientId (formulario de paciente)
 ├─ PDF: html2canvas + jsPDF, generado en el navegador
 └─ Correo: EmailJS desde el navegador (servicio y plantillas externos)
```

No hay servidor de aplicación. El hosting es estático. Cualquier dato es local al navegador del usuario.

### 3.1 Persistencia: `usePersistentState`

Archivo: `src/utils/usePersistentState.js`.

- Equivale a `useState` respaldado por `localStorage` con `JSON.stringify` / `JSON.parse`.
- Escribe en un `useEffect` cada vez que cambia el valor.
- **Aislamiento por cuenta:** si la sesión es `setup`, la clave se prefija con `setup:`. Así la cuenta de primer uso no ve ni modifica los datos del admin.
- No hay control de concurrencia, versionado ni validación de esquema. Un dato corrupto se ignora con un `console.error` y se usa el valor inicial.

### 3.2 Claves de almacenamiento

| Clave (cuenta admin) | Contenido | Usado en |
|---|---|---|
| `clinicplus_patients` | Objeto indexado por id de paciente: datos personales, historia clínica, `treatments[]`, firma de presupuesto | AdminLayout, PatientsList, PatientHistory |
| `clinicplus_appointments` | Array de citas (`date` YYYY-MM-DD, `time`, `status`, `doctor`, `service`) | AdminLayout, Agenda, Dashboard, Reportes |
| `clinicplus_inventory` | Array de artículos (`quantity`, `minStock`, `priceUsd`) | Inventory, Reportes |
| `clinicplus_estudios` | Array de estudios de imagen | AdminLayout, Imagenología |
| `clinicplus_plantillas` | Plantillas de informe radiológico | Plantillas |
| `clinicplus_settings` | Perfil de la clínica y alertas | Settings |
| `clinicplus_sucursales` | Sedes (`nombre`, `direccion`, `responsable`) | Sucursales, Gastos, Laboratorio, Liquidaciones, Reportes |
| `clinicplus_gastos` | Gastos (`fecha`, `categoria`, `monto`, `sucursalId`) | Gastos, Reportes |
| `clinicplus_laboratorio` | Órdenes de laboratorio (`estado`, `costo`, `sucursalId`) | Laboratorio, Reportes |
| `clinicplus_convenios` | Convenios (`descuento`, `vigente`) | Convenios |
| `clinicplus_profesionales` | Profesionales y porcentaje de liquidación | Liquidaciones |
| `clinicplus_liquidaciones` | Liquidaciones (`honorarios`, `porcentaje`, `monto`, `estado`) | Liquidaciones, Reportes |

Cuenta `setup`: las mismas claves con prefijo `setup:`.

Claves de sesión (`sessionStorage`, se pierden al cerrar la pestaña):

| Clave | Valor | Función |
|---|---|---|
| `clinicplus_session` | `admin` o `setup` (el valor antiguo `1` se acepta como `admin`) | Sesión activa |
| `clinicplus_coach_seen` | Array JSON de secciones ya explicadas | Coachmarks por sesión |

Otras escrituras directas, fuera de `usePersistentState`:

- `PatientSelfForm.jsx` escribe `patient_form_<timestamp>` en el `localStorage` del navegador **del paciente**. El comentario dice "para que el admin lo vea", pero el admin, en otro equipo, no puede leer esa clave. Ver sección 8.

### 3.3 Datos que no se persisten

- Los ítems del presupuesto (`TreatmentsTab` → `budgetItems`) viven en estado de React. Se pierden al salir de la ficha del paciente o recargar la página.
- Las notas y la firma del presupuesto se guardan en el paciente solo cuando el flujo lo hace.

---

## 4. Módulos y rutas

Rutas definidas en `src/App.jsx`. Todas bajo `/admin` excepto las marcadas como públicas.

| Ruta | Módulo | Archivo | Estado |
|---|---|---|---|
| `/login` | Acceso | `pages/Login.jsx` | Funcional, cliente |
| `/admin` | Dashboard | `pages/admin/Dashboard.jsx` | Funcional |
| `/admin/agenda` | Agenda de citas | `pages/admin/Agenda.jsx` | Funcional |
| `/admin/patients` | Lista de pacientes | `pages/admin/PatientsList.jsx` | Funcional |
| `/admin/patients/:id` | Ficha clínica: odontograma, periodontograma, tratamientos, presupuesto, firma | `pages/admin/PatientHistory.jsx` + `components/clinical/*` | Funcional |
| `/admin/inventory` | Inventario y conversor USD/Bs | `pages/admin/Inventory.jsx` | Funcional |
| `/admin/imagenologia` | Dashboard de estudios, visor (`estudio/:id`), plantillas | `pages/Imagenologia/*` | Funcional |
| `/admin/informes` | Lista de informes y constructor (`constructor/:id`) | `pages/Informes/*` | Funcional, datos de ejemplo (`mockInformes`) |
| `/admin/reportes` | Reportes de gestión y exportación CSV | `pages/admin/Reportes.jsx` | Nuevo |
| `/admin/sucursales` | Sedes | `pages/admin/Sucursales.jsx` | Nuevo |
| `/admin/gastos` | Gastos | `pages/admin/Gastos.jsx` | Nuevo |
| `/admin/laboratorio` | Órdenes de laboratorio | `pages/admin/Laboratorio.jsx` | Nuevo |
| `/admin/convenios` | Convenios | `pages/admin/Convenios.jsx` | Nuevo |
| `/admin/liquidaciones` | Profesionales y liquidaciones | `pages/admin/Liquidaciones.jsx` | Nuevo |
| `/admin/settings` | Configuración de la clínica | `pages/admin/Settings.jsx` | Funcional |
| `/paciente/ficha/:patientId` | Formulario de historia clínica para el paciente (pública) | `pages/PatientSelfForm.jsx` | Funcional, ver limitación 8.1 |
| `*` | Redirige a `/` y de ahí a `/login` | `App.jsx` | — |

Los módulos Pro nuevos comparten el componente `components/pro/RecordsPage.jsx`: lista, búsqueda, alta, edición, baja y exportación CSV, configurados por props.

### 4.1 Módulos de clínica (detalle)

- **Ficha clínica:** odontograma (`Odontogram.jsx`), periodontograma (`Periodontodiagrama.jsx`, con sondaje de 6 puntos, sangrado, supuración, recesión y movilidad), editor de historia (`ClinicalHistoryEditor.jsx`), firma táctil (`SignatureCanvas.jsx`).
- **Tratamientos:** catálogo en `data/treatmentCatalog.js` (categorías con `priceUSD`), historial (`patient.treatments`), presupuesto (`BudgetWithPDF.jsx`) con tasa USD/VES editable y envío por correo (`sendBudgetEmail`).
- **Reportes:** calcula en cliente a partir de citas, pacientes, inventario, gastos, laboratorio y liquidaciones. Filtros por rango de fechas y sucursal. Las citas no tienen sucursal asignada.

### 4.2 Coachmarks

`components/layout/SectionCoachmark.jsx` muestra una explicación la primera vez que se entra a cada sección en una sesión. Los textos están en `data/sectionHelp.js`. Se reinician al iniciar sesión.

---

## 5. Autenticación y control de acceso

Archivo: `src/utils/auth.js`.

### 5.1 Flujo actual

1. `login(username, password)` calcula `SHA-256(password)` con Web Crypto en el navegador.
2. Compara usuario (sin espacios) y hash contra las variables de entorno:
   - Admin: `VITE_ADMIN_USER` y `VITE_ADMIN_PASSWORD_HASH`.
   - Setup: `VITE_SETUP_USER` y `VITE_SETUP_PASSWORD_HASH`.
3. Si coincide, guarda el rol en `sessionStorage` y borra `clinicplus_coach_seen`.
4. `RequireAuth` (en `App.jsx`) redirige a `/login` si no hay sesión.
5. `logout` borra la clave de sesión.

### 5.2 Limitaciones de seguridad

- **El hash es visible.** `VITE_*` se incrusta en el bundle JavaScript. Cualquiera puede leer el hash y probar contraseñas sin límite, fuera de línea.
- **No hay sesión real.** `sessionStorage` lo controla el propio navegador; se puede escribir `clinicplus_session=admin` a mano y entrar.
- **No hay bloqueo por intentos, ni MFA, ni expiración.**
- **Los datos de pacientes están en claro** en `localStorage`, sin cifrado y accesibles a cualquier script del mismo origen.
- **No hay registro de auditoría.** No se sabe quién vio o cambió una ficha.
- Sin HTTPS, `crypto.subtle` no existe y el login falla (el código lo detecta y avisa).

Conclusión: sirve para un consultorio único en un equipo de confianza. No cumple los requisitos para datos de salud de varias clínicas.

---

## 6. Configuración y variables de entorno

Se leen en tiempo de build con `import.meta.env`. Cambiar una variable exige reconstruir (en desarrollo, reiniciar `npm run dev`).

| Variable | Obligatoria | Uso |
|---|---|---|
| `VITE_ADMIN_USER` | Sí, para el acceso admin | Usuario admin |
| `VITE_ADMIN_PASSWORD_HASH` | Sí, para el acceso admin | SHA-256 hex de la contraseña admin |
| `VITE_SETUP_USER` | Opcional | Usuario de primer uso |
| `VITE_SETUP_PASSWORD_HASH` | Opcional | Hash de la cuenta de primer uso |
| `VITE_EMAILJS_SERVICE_ID` | Para correos | Servicio de EmailJS (por defecto `service_mcvd`) |
| `VITE_EMAILJS_PUBLIC_KEY` | Para correos | Clave pública de EmailJS |
| `VITE_EMAILJS_TEMPLATE_CONFIRM` | Para correos | Confirmación de cita |
| `VITE_EMAILJS_TEMPLATE_REMINDER` | Para correos | Recordatorio de cita |
| `VITE_EMAILJS_TEMPLATE_FORM` | Para correos | Enlace al formulario del paciente |
| `VITE_EMAILJS_TEMPLATE_BUDGET` | Para correos | Envío de presupuesto |

Generar un hash:

```
node -e "console.log(require('crypto').createHash('sha256').update(process.argv[1]).digest('hex'))" 'contraseña'
```

Archivos: `.env.local` (local, no versionar) y `.env.example` (plantilla). Producción: las mismas variables en Vercel → Project Settings → Environment Variables.

---

## 7. Integraciones externas

### 7.1 EmailJS (`src/utils/emailService.js`)

- Cliente cargado de forma diferida (`import('@emailjs/browser')`).
- Funciones: `sendAppointmentConfirmation`, `sendAppointmentReminder`, `sendPatientFormLink`, `sendBudgetEmail`.
- Límite del plan gratuito citado en el código: 200 correos al mes.
- Las credenciales de EmailJS son de cliente (públicas por diseño de EmailJS), pero el envío lo hace el navegador de quien usa la app. No hay registro central de envíos.

**Inconsistencia detectada:** la plantilla del formulario de paciente tiene como valor por defecto `template_form` en `emailService.js`, pero `.env.example` documenta `template_form_link`. Si la variable no se define, se usa un identificador que puede no existir en la cuenta de EmailJS.

### 7.2 PDF

- Presupuesto: `BudgetWithPDF.jsx` clona el nodo fuera de pantalla a 794 px (ancho A4), lo captura con html2canvas y lo pagina en jsPDF.
- Informes: `ConstructorInformeMejorado.jsx` usa `html2pdf.js` para exportar.

### 7.3 Sin integraciones de salud

No hay conexión con SII (facturación electrónica), Fonasa, Isapres, pasarelas de pago, laboratorios externos por API, ni DICOM. La lectura de radiografías es manual.

---

## 8. Limitaciones técnicas conocidas

### 8.1 Bugs y riesgos de datos

1. **Formulario de paciente no llega a la clínica.** `PatientSelfForm.jsx` guarda la respuesta en el `localStorage` del navegador del paciente. Si el paciente llena el formulario en su celular, el admin en su computadora no la ve. Requiere un endpoint o almacenamiento central.
2. **Presupuesto sin persistencia.** Los ítems del presupuesto se pierden al recargar (sección 3.3).
3. **Citas sin sucursal.** `appointments` no tiene `sucursalId`, así que los reportes no filtran citas por sede.
4. **Informes con datos de ejemplo.** `mockInformes` viene de `data/mockData.js` y no se edita desde la app. La cuenta `setup` oculta esos datos, pero no existe un CRUD persistente de informes.
5. **Datos de ejemplo cargados por defecto.** `data/mockData.js` y `data/content.js` contienen pacientes, citas e inventario ficticios que la cuenta admin ve al entrar. No deben usarse con clínicas reales.
6. **Sin versionado de esquema.** Si cambia la forma de un objeto, los datos antiguos en `localStorage` no se migran.
7. **Sin copias de seguridad.** Limpiar el navegador borra todo. No hay respaldo.
8. **Sin pruebas automatizadas.** No hay tests unitarios ni de integración; solo `npm run lint` y `npm run build`.
9. **Duplicación de estilos.** Conviven CSS global, estilos inline y clases de Tailwind sin una convención clara.
10. **Dos librerías de PDF.** El presupuesto usa html2canvas + jsPDF y los informes usan html2pdf.js. Conviene unificar.

### 8.2 Rendimiento

- Todo el estado completo de cada colección se reescribe en `localStorage` en cada cambio. Con cientos de pacientes con imágenes o firmas, se acerca al límite de cuota (≈5 MB por origen en la mayoría de navegadores). La firma en PNG base64 y las imágenes de estudios son los mayores consumidores.
- Los filtros y reportes recorren arrays completos en cada render.

---

## 9. Requisitos para vender a varias clínicas

Objetivo: cada clínica entra con su propio usuario a **su portal**, sus datos quedan aislados y no ve los de otra clínica.

### 9.1 Modelo de tenant

- **Tenant = clínica.** Cada tenant tiene un identificador (`tenant_id`, UUID) y sus datos.
- **Identificación en la URL:** subdominio (`clinica-x.app.dominio.cl`) o ruta (`app.dominio.cl/c/clinica-x`). El subdominio es más limpio para marca blanca; la ruta es más simple al inicio.
- **Usuarios por tenant:** cada usuario pertenece a un tenant y tiene un rol (`admin`, `dentista`, `recepcion`, `solo_lectura`). Un mismo email puede pertenecer a varias clínicas solo si se diseña así explícitamente.
- **Super-admin del proveedor:** rol fuera de todos los tenants, para crear clínicas, suspenderlas y ver métricas de uso sin ver datos clínicos.

### 9.2 Backend obligatorio

Eliminar la lógica de acceso del cliente. El backend debe:

1. Autenticar usuarios (contraseñas con **argon2id** o bcrypt; nunca hashes SHA-256 sin sal en el cliente).
2. Emitir sesiones: cookies `HttpOnly`, `Secure`, `SameSite=Strict` o tokens de corta duración con refresco.
3. Autorizar **cada** petición comprobando `tenant_id` y rol en el servidor.
4. Persistir en base de datos relacional (PostgreSQL recomendado) con todas las tablas que hoy son claves de `localStorage`, más `tenants`, `users`, `memberships`, `audit_logs`.

Opciones de implementación (no excluyentes):

- **Backend as a Service con Postgres y RLS** (por ejemplo Supabase): políticas de *row level security* por `tenant_id`. Rápido de montar, pero la lógica de autorización queda en políticas SQL que hay que probar bien.
- **API propia** (Node/TypeScript, Fastify o Express, o similar) con ORM y middleware de tenant. Más control, más trabajo.

En ambos casos, el aislamiento debe probarse con pruebas automatizadas: un usuario del tenant A no debe poder leer, editar ni listar datos del tenant B, ni por id directo.

### 9.3 Cambios en el frontend

- Reemplazar `usePersistentState` por un cliente de datos (por ejemplo TanStack Query + fetch) con las mismas formas de objeto. Mantener los nombres de campo para no reescribir las páginas.
- Login contra el backend; `RequireAuth` consulta la sesión del servidor, no `sessionStorage`.
- Resolver el tenant desde el host o la ruta antes de cualquier llamada.
- Quitar del bundle las variables sensibles: `VITE_ADMIN_PASSWORD_HASH` y `VITE_SETUP_*` dejan de existir.
- Migrar datos existentes: script que lea el `localStorage` exportado (JSON) y lo cargue en el tenant correspondiente.

### 9.4 Almacenamiento de archivos

Firmas, radiografías y PDFs de presupuesto deben guardarse en almacenamiento de objetos (S3 o equivalente) con prefijo por tenant, acceso por URL firmada de vida corta y sin listado público. Hoy se guardan en base64 dentro del paciente.

### 9.5 Facturación y planes

- Suscripción por clínica (mensual o anual), con planes: Esencial, Pro, etc. Los límites por plan (usuarios, sucursales, almacenamiento, correos) deben vivir en el backend.
- Pasarela de pago (por ejemplo una local con soporte de tarjetas chilenas) y registro de facturas emitidas por el proveedor. La facturación electrónica al SII requiere certificado digital y CAF, y en general un proveedor certificado; evaluarla antes de prometerla.
- Estado de la cuenta: activa, en gracia, suspendida, cancelada, con política de retención de datos definida por contrato.

### 9.6 Cumplimiento para datos de salud en Chile

Revisar con asesoría legal antes de firmar con clínicas. Puntos mínimos a cubrir técnica y contractualmente:

- **Ficha clínica:** el Decreto 41 del Minsal fija un plazo mínimo de conservación de la ficha. La documentación del proveedor debe describir cómo se respeta y cómo se exporta.
- **Protección de datos personales:** Ley 19.628 vigente hoy. La Ley 21.719 tiene fecha de entrada en vigor en discusión legislativa (las fuentes revisadas dan fechas distintas); verificar el estado vigente a la fecha de firma.
- **Contrato de encargo de tratamiento** entre la clínica (responsable) y el proveedor (encargado), con lista de subencargados (hosting, correo, almacenamiento) y ubicación de los datos.
- **Seguridad:** cifrado en tránsito (TLS) y en reposo, copias de seguridad probadas con restauración, registro de accesos y cambios a fichas (quién, cuándo, qué), gestión de incidentes con plazo de notificación.
- **Derechos de los titulares:** acceso, rectificación, cancelación y portabilidad, con procedimiento documentado.
- **Consentimiento y finalidad:** la política de privacidad debe describir finalidades concretas. No usar datos de pacientes para entrenar modelos sin base legal.

### 9.7 Operación

- Entornos separados: desarrollo, staging, producción. Migraciones de base de datos versionadas.
- Copias de seguridad automáticas con retención definida y restauración probada periódicamente.
- Monitoreo: errores (por ejemplo Sentry), logs de backend, disponibilidad.
- Soporte: canal, tiempos de respuesta y ventanas de mantenimiento en el contrato.
- Pruebas: unitarias y de integración del backend, pruebas de aislamiento entre tenants, pruebas end-to-end de los flujos de clínica (cita, ficha, presupuesto, boleta).
- Control de versiones: inicializar el repositorio con historial antes de cualquier entrega.

---

## 10. Plan de trabajo sugerido

Las estimaciones son orientativas y dependen del equipo; no están validadas.

| Fase | Alcance | Criterio de salida |
|---|---|---|
| 0. Base | Repositorio con historial, pruebas mínimas, CI con lint y build, separar config de secretos | Historial y CI verdes |
| 1. Backend y datos | Postgres, esquema por tenant con `tenant_id`, API de lectura y escritura para pacientes, citas e inventario, auth real | Pruebas de aislamiento entre tenants pasando |
| 2. Migración del frontend | Reemplazar `usePersistentState` por cliente de API, login contra servidor, resolver tenant por URL | Flujo completo de cita y ficha funcionando contra API |
| 3. Módulos restantes | Presupuesto, informes, imagenología con archivos en almacenamiento, Pro (reportes, gastos, laboratorio, convenios, liquidaciones, sucursales) | Paridad de funciones con la versión local |
| 4. Cumplimiento y seguridad | Auditoría de accesos, cifrado, respaldos probados, contrato de encargo, política de privacidad revisada | Revisión legal y prueba de restauración documentadas |
| 5. Comercial | Super-admin, alta de clínicas, facturación y planes, soporte | Una clínica piloto operando con datos reales |

Antes de la fase 5 conviene un piloto con una clínica real, con datos migrados y respaldos verificados.

---

## 11. Checklist de aceptación para venta

- [ ] Login con usuario propio por clínica, contraseña con hash fuerte en servidor y MFA opcional.
- [ ] Cada clínica entra a su URL o subdominio y solo ve sus datos.
- [ ] Pruebas automatizadas de aislamiento entre tenants en verde.
- [ ] Ningún secreto ni hash de contraseña en el bundle del navegador.
- [ ] Registro de auditoría de accesos y cambios a fichas clínicas.
- [ ] Copias de seguridad automáticas con restauración probada.
- [ ] Contrato de encargo y política de privacidad revisados por abogado.
- [ ] Formulario de paciente conectado al servidor (sección 8.1, punto 1).
- [ ] Exportación completa de los datos de una clínica en formato documentado.
- [ ] Procedimiento de baja y eliminación de datos al término del contrato.
- [ ] Repositorio con historial, CI y migraciones versionadas.

---

## 12. Glosario

- **Tenant:** clínica cliente con datos aislados.
- **RLS (Row Level Security):** restricción en la base de datos que limita las filas visibles según el usuario.
- **Encargado de tratamiento:** quien procesa datos por cuenta del responsable (en este caso el proveedor, por cuenta de la clínica).
- **Subencargado:** tercero que el encargado usa para procesar datos (hosting, correo, almacenamiento).
