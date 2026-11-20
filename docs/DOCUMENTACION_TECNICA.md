# ClinicPlus / MCVD — Documentación técnica

**Actualizada:** 2026-11-18. Describe el código de la rama `claude/compassionate-hamilton-iuz1kp` y la base de datos de Supabase del proyecto **CliniPlus Project** (`elsgbeupmvsqwkdiineb`).

**Para quién:** desarrollo, mantenimiento y evaluación técnica. El manual para quienes usan la app está en [`MANUAL_DE_USO.md`](./MANUAL_DE_USO.md).

**Qué cambió desde la versión del 2026-11-16:** los datos dejaron de vivir solo en el navegador. Ahora se guardan en Supabase (PostgreSQL), el inicio de sesión usa Supabase Auth y el acceso a los datos está protegido por reglas RLS en la base. El formulario público del paciente ahora llega a la clínica.

---

## Índice

1. [Resumen](#1-resumen)
2. [Stack tecnológico](#2-stack-tecnológico)
3. [Arquitectura](#3-arquitectura)
4. [Estructura del repositorio](#4-estructura-del-repositorio)
5. [Base de datos (Supabase)](#5-base-de-datos-supabase)
6. [Autenticación y control de acceso](#6-autenticación-y-control-de-acceso)
7. [Persistencia de datos en el frontend](#7-persistencia-de-datos-en-el-frontend)
8. [Módulos y rutas](#8-módulos-y-rutas)
9. [Integraciones externas](#9-integraciones-externas)
10. [Configuración y variables de entorno](#10-configuración-y-variables-de-entorno)
11. [Desarrollo local, build y despliegue](#11-desarrollo-local-build-y-despliegue)
12. [Operación: usuarios, clínicas y migraciones](#12-operación-usuarios-clínicas-y-migraciones)
13. [Herramientas para Claude Code](#13-herramientas-para-claude-code)
14. [Limitaciones conocidas](#14-limitaciones-conocidas)
15. [Próximos pasos recomendados](#15-próximos-pasos-recomendados)
16. [Glosario](#16-glosario)

---

## 1. Resumen

- **Aplicación web de una sola página (SPA)** en React 19 + Vite 8, desplegada como sitio estático en Vercel.
- **Backend: Supabase** (PostgreSQL 17, región `us-west-2`). No hay servidor propio: el navegador habla directamente con la API de Supabase usando la clave publicable.
- **Seguridad en la base:** todas las tablas tienen *Row Level Security* (RLS). Un usuario solo ve los datos de la clínica a la que pertenece. La clave publicable incluida en el bundle no da acceso a datos sin una sesión válida de un miembro.
- **Multi-clínica (base):** el modelo de datos ya separa clínicas (`clinics`) y miembros (`clinic_members`). Hoy existen dos clínicas: **Clínica MCVD** (datos reales, arranca vacía) y **Demo MCVD** (datos de ejemplo).
- **Formato de datos:** cada sección de la app (pacientes, agenda, inventario…) se guarda como un documento JSON por clínica en la tabla `clinic_data`. Ver [§5.3](#53-por-qué-documentos-json-y-no-tablas-por-entidad) para las ventajas y límites de esta decisión.

---

## 2. Stack tecnológico

| Capa | Tecnología | Versión / nota |
|---|---|---|
| UI | React | `^19.2.4` |
| Build | Vite | `^8.0.1` |
| Enrutado | react-router-dom | `^7.16.0` (`BrowserRouter`) |
| Backend / BD | Supabase (PostgreSQL 17) | Proyecto `elsgbeupmvsqwkdiineb` |
| Cliente BD y Auth | `@supabase/supabase-js` | v2 |
| Iconos | lucide-react | `^0.577.0` |
| Animación | framer-motion | `^12.38.0` |
| Arrastrar y soltar | @dnd-kit/core, sortable, utilities | Constructor de informes |
| Firma digital | react-signature-canvas | `^1.1.0-alpha.2` (prerelease) |
| PDF | jspdf + html2canvas (presupuesto), html2pdf.js (informes) | Generado en el navegador |
| Correo | @emailjs/browser | `^5.0.3`, envío desde el navegador |
| Estilos | CSS propio (`src/index.css`), estilos inline en componentes, Tailwind vía PostCSS | Conviven los tres enfoques |
| Lint | ESLint 9 + react-hooks + react-refresh | `npm run lint` |
| Hosting | Vercel | `vercel.json` reescribe todas las rutas a `index.html` |

Scripts (`package.json`): `dev`, `build`, `lint`, `preview`.

---

## 3. Arquitectura

```
Navegador (SPA React)
 │
 ├─ main.jsx ── initAuth(): recupera la sesión de Supabase ANTES de renderizar
 │
 ├─ /login ──────────────► supabase.auth.signInWithPassword(email, contraseña)
 │                          + lectura de clinic_members → clínica del usuario
 │
 ├─ /admin/* (RequireAuth: sesión + clínica)
 │    ├─ AdminLayout ── usePersistentState(...) ──┐
 │    └─ Páginas ────── usePersistentState(...) ──┤
 │                                                ▼
 │                          Supabase REST (PostgREST) ── tabla clinic_data
 │                          (filtrado por RLS: solo la clínica del usuario)
 │                          + copia local en localStorage (caché)
 │
 ├─ /paciente/ficha/:id?c=<clinic_id>  (pública, sin login)
 │    └─ INSERT en patient_form_submissions (RLS: solo insertar)
 │
 ├─ PDF: html2canvas + jsPDF / html2pdf.js en el navegador
 └─ Correo: EmailJS desde el navegador
```

**Principio de seguridad:** el frontend nunca decide quién puede ver qué. Esa decisión la toman las políticas RLS en PostgreSQL. Aunque alguien modifique el JavaScript en su navegador, la base solo le devuelve filas de las clínicas de las que es miembro.

---

## 4. Estructura del repositorio

```
MCVD/
├── .claude/skills/            Skills de Supabase para Claude Code (ver §13)
├── .mcp.json                  Servidor MCP de Supabase para Claude Code (ver §13)
├── .env.example               Plantilla de variables de entorno
├── docs/
│   ├── DOCUMENTACION_TECNICA.md   Este documento
│   └── MANUAL_DE_USO.md           Manual para usuarios de la clínica
├── supabase/migrations/       Migraciones SQL versionadas (esquema + RLS)
├── public/                    Archivos estáticos
├── src/
│   ├── main.jsx               Punto de entrada: initAuth() y render
│   ├── App.jsx                Rutas y RequireAuth
│   ├── lib/supabase.js        Cliente de Supabase
│   ├── utils/
│   │   ├── auth.js            Login/logout, sesión y clínica actual
│   │   ├── usePersistentState.js  Estado sincronizado con Supabase
│   │   ├── emailService.js    Envíos con EmailJS
│   │   ├── csv.js             Exportación CSV
│   │   ├── date.js, format.js Utilidades de formato
│   │   └── sucursales.js      Clave y helpers de sucursales
│   ├── components/
│   │   ├── layout/            AdminLayout (menú lateral), coachmarks, header, footer
│   │   ├── clinical/          Odontograma, periodontograma, historia, tratamientos,
│   │   │                      presupuesto con PDF, firma
│   │   └── pro/RecordsPage.jsx  Lista/CRUD/CSV genérico (gastos, laboratorio, etc.)
│   ├── pages/
│   │   ├── Login.jsx, PatientSelfForm.jsx
│   │   ├── admin/             Dashboard, Agenda, Pacientes, Inventario, Reportes,
│   │   │                      Sucursales, Gastos, Laboratorio, Convenios,
│   │   │                      Liquidaciones, Settings
│   │   ├── Imagenologia/      Estudios, visor, plantillas
│   │   └── Informes/          Lista y constructor de informes radiológicos
│   ├── data/                  Datos de ejemplo, catálogo de tratamientos,
│   │                          textos de ayuda, configuración Pro
│   └── context/LanguageContext.jsx
├── vercel.json, vite.config.js, eslint.config.js
└── package.json
```

---

## 5. Base de datos (Supabase)

Proyecto: **CliniPlus Project**, ref `elsgbeupmvsqwkdiineb`, URL `https://elsgbeupmvsqwkdiineb.supabase.co`.

Migración que crea todo: [`supabase/migrations/20261118000000_clinic_schema_auth_rls.sql`](../supabase/migrations/20261118000000_clinic_schema_auth_rls.sql).

### 5.1 Tablas (esquema `public`)

#### `clinics` — clínicas

| Columna | Tipo | Nota |
|---|---|---|
| `id` | `uuid` PK | `gen_random_uuid()` |
| `name` | `text` | 1–200 caracteres |
| `demo_data` | `boolean` | `true`: la app arranca con datos de ejemplo |
| `created_at` | `timestamptz` | |

Filas actuales:

| id | name | demo_data |
|---|---|---|
| `6736ae2a-6ab1-4ef4-9e52-876258092f19` | Clínica MCVD | `false` |
| `28c51a1a-cacc-463b-a946-009f1a328fdb` | Demo MCVD | `true` |

#### `clinic_members` — usuarios de cada clínica

| Columna | Tipo | Nota |
|---|---|---|
| `clinic_id` | `uuid` FK → `clinics.id` | `on delete cascade` |
| `user_id` | `uuid` FK → `auth.users.id` | `on delete cascade` |
| `role` | `text` | `owner` o `staff` (hoy la app no distingue permisos por rol) |
| `created_at` | `timestamptz` | |

PK: `(clinic_id, user_id)`. Índice en `user_id`.

#### `clinic_data` — datos de la app

| Columna | Tipo | Nota |
|---|---|---|
| `clinic_id` | `uuid` FK → `clinics.id` | |
| `collection` | `text` | Nombre de la colección; debe cumplir `^[a-z0-9_]{1,64}$` |
| `value` | `jsonb` | Contenido completo de la colección |
| `updated_at` | `timestamptz` | Lo fija un trigger en cada escritura |
| `updated_by` | `uuid` FK → `auth.users.id` | Lo fija un trigger con `auth.uid()` |

PK: `(clinic_id, collection)`.

Colecciones que usa la app (valor de `collection`):

| Colección | Contenido | Pantallas |
|---|---|---|
| `clinicplus_patients` | Objeto indexado por id de paciente: datos personales, historia clínica, odontograma, periodontograma, `treatments[]`, `planTratamientos[]`, `presupuesto`, `cuenta` (cargos y pagos), firmas (PNG en base64) | Pacientes, ficha, Dashboard, Reportes |
| `clinicplus_appointments` | Array de citas (`date` YYYY-MM-DD, `time`, `status`, `doctor`, `service`, `patient`, `patientEmail`) | Agenda, Dashboard, Reportes |
| `clinicplus_inventory` | Array de artículos (`quantity`, `minStock`, `priceUsd`, categoría) | Inventario, Dashboard, Reportes |
| `clinicplus_estudios` | Array de estudios de imagen | Imagenología |
| `clinicplus_plantillas` | Plantillas de informe radiológico | Imagenología → Plantillas |
| `clinicplus_settings` | Perfil de la clínica y preferencias | Configuración |
| `clinicplus_sucursales` | Sedes (`nombre`, `direccion`, `responsable`) | Sucursales, Gastos, Laboratorio, Liquidaciones, Reportes |
| `clinicplus_gastos` | Gastos (`fecha`, `categoria`, `monto`, `sucursalId`) | Gastos, Reportes |
| `clinicplus_laboratorio` | Órdenes de laboratorio (`estado`, `costo`, `sucursalId`) | Laboratorio, Reportes |
| `clinicplus_convenios` | Convenios (`descuento`, `vigente`) | Convenios |
| `clinicplus_profesionales` | Profesionales y % de liquidación | Liquidaciones |
| `clinicplus_liquidaciones` | Liquidaciones (`honorarios`, `porcentaje`, `monto`, `estado`) | Liquidaciones, Reportes |

Una fila se crea la primera vez que alguien de la clínica abre la pantalla que usa esa colección.

#### `patient_form_submissions` — fichas enviadas por pacientes

| Columna | Tipo | Nota |
|---|---|---|
| `id` | `uuid` PK | |
| `clinic_id` | `uuid` FK → `clinics.id` | Viene del parámetro `?c=` del enlace |
| `patient_ref` | `text` | Id de paciente de la URL (≤ 100 caracteres) |
| `data` | `jsonb` | Respuestas del formulario (< 100 KB) |
| `submitted_at` | `timestamptz` | |
| `reviewed_at` | `timestamptz` | `null` hasta que la clínica la marque revisada |

Índice: `(clinic_id, submitted_at desc)`.

### 5.2 Funciones y triggers (esquema `private`, no expuesto por la API)

| Función | Tipo | Uso |
|---|---|---|
| `private.is_clinic_member(cid uuid)` | `security definer`, `stable` | ¿El usuario actual (`auth.uid()`) es miembro de la clínica? La usan las políticas RLS. Ejecutable solo por `authenticated`. |
| `private.clinic_exists(cid uuid)` | `security definer`, `stable` | ¿Existe la clínica? La usa la política del formulario público, que no puede leer `clinics`. |
| `private.touch_clinic_data()` | trigger | `BEFORE INSERT OR UPDATE` en `clinic_data`: fija `updated_at = now()` y `updated_by = auth.uid()`. |

Todas usan `search_path = ''` para evitar suplantación de objetos.

### 5.3 Por qué documentos JSON y no tablas por entidad

**Decisión:** guardar cada colección completa como un `jsonb` por clínica, en lugar de tablas `patients`, `appointments`, etc. con columnas.

**Ventajas:**
- No hubo que reescribir las ~20 pantallas existentes: siguen trabajando con los mismos objetos que antes.
- La migración desde `localStorage` es automática (ver [§7.2](#72-migración-automática-desde-la-versión-anterior)).
- La seguridad no cambia: RLS protege igual por clínica.

**Límites:**
- **Concurrencia:** si dos personas editan la misma colección a la vez, gana la última escritura (se pierde el cambio de la otra).
- **Tamaño:** cada cambio reescribe la colección completa. Con muchos pacientes con firmas o imágenes en base64, `clinicplus_patients` crece y cada guardado es más lento.
- **Consultas:** no se pueden hacer reportes SQL cómodos ni índices por campo.
- **Auditoría:** solo se sabe quién hizo el último cambio de cada colección, no el historial.

Cuando estos límites empiecen a afectar el uso real, el siguiente paso es normalizar primero las colecciones más grandes o más editadas (pacientes y citas) en tablas propias. Ver [§15](#15-próximos-pasos-recomendados).

---

## 6. Autenticación y control de acceso

### 6.1 Inicio de sesión (`src/utils/auth.js`)

1. **Al abrir la app**, `main.jsx` llama a `initAuth()` antes de renderizar:
   - `supabase.auth.getSession()` recupera la sesión guardada por Supabase (en `localStorage`, renovada automáticamente).
   - Si hay sesión, carga la membresía: `clinic_members` + `clinics(name, demo_data)`.
   - Registra `onAuthStateChange`: si la sesión expira o se cierra en otra pestaña, redirige a `/login`.
2. **Login** (`login(email, password)`):
   - `supabase.auth.signInWithPassword`.
   - Carga la membresía. **Si el usuario no pertenece a ninguna clínica, se cierra la sesión** y se muestra "Tu usuario no tiene una clínica asignada".
   - Borra `clinicplus_coach_seen` para que vuelvan a mostrarse las ayudas de sección.
3. **Logout** (`logout()`): limpia el estado y llama a `supabase.auth.signOut()`.

API exportada:

| Función | Devuelve |
|---|---|
| `initAuth()` | `Promise<void>` |
| `login(email, password)` | `{ success: true }` o `{ success: false, error }` |
| `logout()` | `Promise<void>` |
| `isAuthenticated()` | `true` si hay sesión **y** clínica |
| `isSetupAccount()` | `true` si la clínica **no** usa datos de ejemplo (`demo_data = false`) |
| `getClinicId()`, `getClinicName()` | Clínica actual |

`RequireAuth` (en `App.jsx`) usa `isAuthenticated()` para proteger `/admin/*`.

Si un usuario pertenece a varias clínicas, hoy se usa la primera en la que fue agregado (por `created_at`). No hay selector de clínica.

### 6.2 Reglas de acceso (RLS)

Permisos de tabla (`GRANT`) mínimos + políticas:

| Tabla | `anon` (sin sesión) | `authenticated` (con sesión) |
|---|---|---|
| `clinics` | — | Leer solo sus clínicas |
| `clinic_members` | — | Leer solo sus propias membresías |
| `clinic_data` | — | Leer, crear, editar y borrar solo de sus clínicas |
| `patient_form_submissions` | Solo **insertar**, en una clínica existente y con `reviewed_at` vacío | Insertar; leer, marcar revisada y borrar solo de sus clínicas |

Nadie puede crear clínicas ni membresías desde la app: se hace desde el panel de Supabase o por SQL (ver [§12](#12-operación-usuarios-clínicas-y-migraciones)).

### 6.3 Pruebas realizadas

Se probaron en la base, simulando usuarios dentro de una transacción revertida (2026-11-18). Las 10 pasaron:

| Caso | Resultado esperado |
|---|---|
| Miembro lee los datos de su clínica | ✅ ve sus filas |
| Miembro ve solo su clínica | ✅ 1 clínica |
| Miembro intenta escribir en otra clínica | ✅ rechazado |
| Usuario sin clínica lee datos | ✅ 0 filas |
| Usuario sin clínica lee clínicas | ✅ 0 filas |
| Usuario sin clínica intenta modificar datos | ✅ sin efecto |
| Anónimo envía una ficha | ✅ permitido |
| Anónimo lee fichas | ✅ rechazado |
| Anónimo lee datos de la clínica | ✅ rechazado |
| Anónimo envía ficha a clínica inexistente | ✅ rechazado |

El asesor de seguridad de Supabase (*Security Advisor*) no reporta alertas.

**Pendiente de probar:** un inicio de sesión real desde el navegador contra Supabase (la red del entorno donde se desarrolló bloquea `supabase.co`).

### 6.4 Recomendaciones de configuración en Supabase

- **Desactivar el registro público:** *Authentication → Sign In / Providers → Email → Allow new users to sign up* = desactivado. Aunque esté activo, un usuario registrado sin membresía no ve datos.
- **URL del sitio:** *Authentication → URL Configuration → Site URL* = la URL de producción en Vercel, para que los correos de restablecimiento de contraseña apunten al lugar correcto.
- Considerar MFA para cuentas `owner`.

---

## 7. Persistencia de datos en el frontend

Archivo: `src/utils/usePersistentState.js`. Misma interfaz que `useState`: `const [value, setValue] = usePersistentState(clave, valorInicial)`.

### 7.1 Funcionamiento

1. **Valor inicial inmediato** (para no mostrar la pantalla vacía mientras carga), en este orden:
   1. Caché local `clinic:<clinic_id>:<clave>` en `localStorage`.
   2. Datos de la versión anterior (ver §7.2).
   3. `valorInicial` (datos de ejemplo si la clínica es demo, vacío si no).
2. **Carga desde Supabase:** `select value from clinic_data where clinic_id = … and collection = …`.
   - Si existe, reemplaza el valor y actualiza la caché.
   - Si no existe, **sube el valor actual** (`upsert … ignoreDuplicates`: si otra pestaña lo creó primero, se respeta el suyo).
   - Si la carga falla, **no se guarda nada** en esa pantalla para no pisar datos de la base con una copia vieja.
3. **Guardado:** cada cambio se escribe en la caché local y, tras 500 ms sin nuevos cambios, se hace `upsert` en `clinic_data`. Si la pantalla se cierra antes de esos 500 ms, se guarda de inmediato.
4. Los errores se registran en la consola del navegador (`No se pudo guardar …`). **No hay aviso visual** al usuario.

### 7.2 Migración automática desde la versión anterior

Antes de Supabase, los datos estaban en `localStorage` con estas claves:

- Cuenta admin: `clinicplus_patients`, `clinicplus_appointments`, … (sin prefijo).
- Cuenta secundaria de primer uso: `setup:clinicplus_patients`, …

La primera vez que un miembro abre una pantalla y la colección **no existe todavía en Supabase**, se sube lo que había en ese navegador:

- Clínica con `demo_data = true` (Demo MCVD) ← claves sin prefijo (antigua cuenta admin).
- Clínica con `demo_data = false` (Clínica MCVD) ← claves `setup:` (antigua cuenta secundaria).

Las claves antiguas no se borran. **Importante:** el primer navegador que abra cada pantalla define el contenido inicial en Supabase. Conviene que la primera persona en entrar lo haga desde el equipo que tiene los datos reales.

### 7.3 Otras claves locales

| Almacenamiento | Clave | Uso |
|---|---|---|
| `localStorage` | `sb-elsgbeupmvsqwkdiineb-auth-token` | Sesión de Supabase (la gestiona supabase-js) |
| `localStorage` | `clinic:<clinic_id>:<colección>` | Caché de cada colección |
| `sessionStorage` | `clinicplus_coach_seen` | Secciones cuya ayuda ya se mostró en esta sesión |

---

## 8. Módulos y rutas

Rutas en `src/App.jsx`. Las páginas se cargan de forma diferida (`lazy`).

| Ruta | Módulo | Archivo(s) | Datos |
|---|---|---|---|
| `/login` | Acceso | `pages/Login.jsx` | Supabase Auth |
| `/admin` | Dashboard | `pages/admin/Dashboard.jsx` | pacientes, citas, inventario |
| `/admin/agenda` | Agenda | `pages/admin/Agenda.jsx` | `clinicplus_appointments` |
| `/admin/patients` | Pacientes | `pages/admin/PatientsList.jsx` | `clinicplus_patients` |
| `/admin/patients/:id` | Ficha clínica | `pages/admin/PatientHistory.jsx`, `components/clinical/*` | `clinicplus_patients` |
| `/admin/inventory` | Inventario + conversor USD/Bs | `pages/admin/Inventory.jsx` | `clinicplus_inventory` |
| `/admin/imagenologia` | Estudios | `pages/Imagenologia/Dashboard.jsx` | `clinicplus_estudios` |
| `/admin/imagenologia/estudio/:id` | Visor | `pages/Imagenologia/VisorEstudio.jsx` | `clinicplus_estudios` |
| `/admin/imagenologia/plantillas` | Plantillas | `pages/Imagenologia/Plantillas.jsx` | `clinicplus_plantillas` |
| `/admin/informes` | Informes radiológicos | `pages/Informes/InformesDashboard.jsx` | Datos de ejemplo (`mockInformes`), no persistentes |
| `/admin/informes/constructor/:id` | Constructor de informe | `pages/Informes/ConstructorInformeMejorado.jsx` | Ídem |
| `/admin/reportes` | Reportes y exportación CSV | `pages/admin/Reportes.jsx` | Varias colecciones (solo lectura) |
| `/admin/sucursales` | Sucursales | `pages/admin/Sucursales.jsx` | `clinicplus_sucursales` |
| `/admin/gastos` | Gastos | `pages/admin/Gastos.jsx` | `clinicplus_gastos` |
| `/admin/laboratorio` | Laboratorio | `pages/admin/Laboratorio.jsx` | `clinicplus_laboratorio` |
| `/admin/convenios` | Convenios | `pages/admin/Convenios.jsx` | `clinicplus_convenios` |
| `/admin/liquidaciones` | Profesionales y liquidaciones | `pages/admin/Liquidaciones.jsx` | `clinicplus_profesionales`, `clinicplus_liquidaciones` |
| `/admin/settings` | Configuración | `pages/admin/Settings.jsx` | `clinicplus_settings` |
| `/registro` | Solicitud de alta de clínica (pública) | `pages/Registro.jsx` | Edge Function `clinic-signup` |
| `/aprobar-clinica?id=…&token=…` | Revisión de una solicitud desde el correo | `pages/AprobarClinica.jsx` | Edge Function `clinic-approval` |
| `/plataforma` | Panel del administrador de la plataforma | `pages/Plataforma.jsx` | `admin_overview()`, `admin_review_clinic_request()` |
| `/paciente/ficha/:patientId?c=<clinic_id>` | Formulario del paciente (público) | `pages/PatientSelfForm.jsx` | INSERT en `patient_form_submissions` |
| `*` | Redirige a `/login` | `App.jsx` | — |

### 8.1 Componentes destacados

- **`AdminLayout`**: menú lateral, cierre de sesión, y estado compartido (pacientes, citas, inventario, estudios) que pasa a las páginas mediante el contexto de `Outlet`.
- **`RecordsPage`** (`components/pro/`): lista con búsqueda, alta, edición, baja y exportación CSV, configurada por props (`storageKey`, `fields`, `columns`…). La usan Sucursales, Gastos, Laboratorio, Convenios y Liquidaciones.
- **Clínicos** (`components/clinical/`): `Odontogram`, `Periodontodiagrama` (sondaje de 6 puntos, sangrado, supuración, recesión, movilidad), `ClinicalHistoryEditor`, `TreatmentsTab` + `BudgetWithPDF` (catálogo en `data/treatmentCatalog.js`, tasa USD/VES editable, PDF A4), `SignatureCanvas`.
- **Pagos** (`components/clinical/PaymentsTab.jsx`, lógica en `utils/cuenta.js`): cuenta del paciente en `patient.cuenta = { cargos: [], pagos: [] }`, separada de `patient.presupuesto` (que vence y se renueva). Cargo: `{ id, fecha, vence, descripcion, montoUSD, presupuestoId? }`. Pago: `{ id, fecha, forma, moneda, montoUSD, montoBs?, tasa?, referencia, nota, registradoPor, registradoEn }`. `estadoCuenta()` aplica los pagos a los cargos más antiguos (FIFO) y devuelve totales, detalle por cargo y el estado `sin_cargos` / `al_dia` / `pendiente` / `atrasado` (hay cargo con `vence` pasado y saldo). Los montos se guardan en USD; los pagos en Bs guardan además el monto en Bs y la tasa.
- **Coachmarks** (`components/layout/SectionCoachmark.jsx`, textos en `data/sectionHelp.js`): explicación breve la primera vez que se entra a cada sección en una sesión.

---

## 9. Integraciones externas

### 9.1 Supabase

- Cliente: `src/lib/supabase.js` (`createClient(VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY)`).
- Servicios usados: Auth (email + contraseña) y Data API (PostgREST). No se usan Storage, Realtime ni Edge Functions.

### 9.2 EmailJS (`src/utils/emailService.js`)

| Función | Dónde se usa | Plantilla |
|---|---|---|
| `sendAppointmentConfirmation` | Agenda → modal de cita | `VITE_EMAILJS_TEMPLATE_CONFIRM` |
| `sendAppointmentReminder` | (disponible, sin botón en la UI) | `VITE_EMAILJS_TEMPLATE_REMINDER` |
| `sendPatientFormLink` | Ficha del paciente → "Enviar Formulario" | `VITE_EMAILJS_TEMPLATE_FORM` |
| `sendBudgetEmail` | Presupuesto | `VITE_EMAILJS_TEMPLATE_BUDGET` |

- El enlace del formulario es `https://<sitio>/paciente/ficha/<patientId>?c=<clinic_id>`. **El parámetro `c` es obligatorio**: sin él el formulario no se puede enviar.
- La librería se carga solo cuando se envía un correo. Plan gratuito: 200 correos/mes.
- **Inconsistencia:** el valor por defecto de la plantilla del formulario en el código es `template_form`, pero `.env.example` usa `template_form_link`. Definir siempre la variable.

### 9.3 PDF

- Presupuesto: `BudgetWithPDF.jsx` clona el nodo a 794 px (A4), lo captura con html2canvas y lo pagina con jsPDF.
- Informes: `ConstructorInformeMejorado.jsx` usa html2pdf.js.

### 9.4 No implementado

- **Link de pago** (Dashboard): genera una URL de ejemplo (`https://clinicplus.com/pay/…`) sin pasarela real. No cobra.
- Sin facturación electrónica, pasarelas de pago, DICOM ni integraciones con aseguradoras.

---

## 10. Configuración y variables de entorno

Vite incrusta las variables `VITE_*` en el bundle al compilar: **cambiar una exige volver a desplegar** (en local, reiniciar `npm run dev`). Todas son públicas por diseño; no poner secretos en variables `VITE_*`.

| Variable | Obligatoria | Uso |
|---|---|---|
| `VITE_SUPABASE_URL` | **Sí** | `https://elsgbeupmvsqwkdiineb.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | **Sí** | Clave publicable (`sb_publishable_…`). Segura en el navegador; la protección la da RLS |
| `VITE_EMAILJS_SERVICE_ID` | Para correos | Servicio de EmailJS |
| `VITE_EMAILJS_PUBLIC_KEY` | Para correos | Clave pública de EmailJS |
| `VITE_EMAILJS_TEMPLATE_CONFIRM` | Para correos | Confirmación de cita |
| `VITE_EMAILJS_TEMPLATE_REMINDER` | Para correos | Recordatorio |
| `VITE_EMAILJS_TEMPLATE_FORM` | Para correos | Enlace al formulario del paciente |
| `VITE_EMAILJS_TEMPLATE_BUDGET` | Para correos | Presupuesto |

**Eliminadas:** `VITE_ADMIN_USER`, `VITE_ADMIN_PASSWORD_HASH`, `VITE_SETUP_USER`, `VITE_SETUP_PASSWORD_HASH`. Ya no se usan; se pueden borrar de Vercel.

Archivos: `.env` (local, no se versiona) y `.env.example` (plantilla versionada).

**Nunca** poner la clave `service_role` / secreta de Supabase en el frontend: salta todas las reglas RLS.

---

## 11. Desarrollo local, build y despliegue

### 11.1 Requisitos

- Node.js 20 o superior (probado con 22) y npm.

### 11.2 Puesta en marcha

```bash
git clone https://github.com/lemarealejandro/MCVD.git
```

```bash
cd MCVD && npm install
```

```bash
cp .env.example .env
```

Completar las variables de EmailJS en `.env` si se van a enviar correos, y luego:

```bash
npm run dev
```

La app queda en `http://localhost:5173`. Con el `.env` de `.env.example` se trabaja **contra la base de producción**. Para desarrollar sin tocar datos reales, usa en tu `.env` las variables del ambiente de pruebas (§11.5).

### 11.3 Calidad y build

```bash
npm run lint
```

```bash
npm run build
```

El build genera `dist/`. `npm run preview` lo sirve en local.

### 11.4 Despliegue en Vercel

1. En *Project Settings → Environment Variables*, definir todas las variables de §10 (al menos las dos de Supabase).
2. Desplegar la rama. `vercel.json` reescribe cualquier ruta a `index.html` para que funcionen las rutas de React Router.
3. En Supabase, poner la URL de producción en *Authentication → URL Configuration*.

---

### 11.5 Ambiente de pruebas (staging)

Copia completa del sistema para probar cambios sin tocar los datos reales.

| | Producción | Pruebas |
|---|---|---|
| Rama de GitHub | `main` | `staging` |
| App (Vercel) | https://mcvd.vercel.app | Despliegue *Preview* de la rama `staging` (p. ej. `https://mcvd-git-staging-lemarealejandros-projects.vercel.app`; la dirección exacta aparece en Vercel → Deployments) |
| Proyecto de Supabase | **CliniPlus Project** (`elsgbeupmvsqwkdiineb`) | **CliniPlus Pruebas** (`tetemzzaqyqcmmshhswq`, plan gratuito, región `us-west-1`) |
| `VITE_SUPABASE_URL` | `https://elsgbeupmvsqwkdiineb.supabase.co` | `https://tetemzzaqyqcmmshhswq.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_ZZoJgR0cAw1c6tLQxNf9_w_-_WD48GS` | `sb_publishable__3ICTuUDxq-1p0SEaxJuvg_b_EWBLw6` |
| Clínicas iniciales | Clínica MCVD, Demo MCVD (+ las aprobadas) | Clínica Pruebas, Demo Pruebas |
| Datos | Reales | De prueba; se pueden borrar |

El proyecto de pruebas tiene las mismas migraciones (`supabase/migrations/`) y las mismas Edge Functions (`clinic-signup`, `clinic-approval`) que producción, aplicadas el 2026-11-18.

**Configuración en Vercel (una sola vez):** *Settings → Environment Variables*, agregar las dos variables de la columna *Pruebas* con **Environment = Preview** y **rama `staging`**. Las variables de producción quedan en *Production*. Después de cambiarlas, hacer **Redeploy** del deployment de `staging`.

**Secretos de las Edge Functions en pruebas:** `RESEND_API_KEY` se configura aparte en el proyecto de pruebas (*Edge Functions → Secrets*). Sin ella, las solicitudes se guardan pero no llega correo.

**Usuarios de pruebas:** se crean en el proyecto de pruebas (*Authentication → Users → Add user*, con *Auto Confirm User*) y se asignan con el mismo SQL de §12.1 usando los ids de las clínicas de pruebas, o registrándose con **Solicita acceso** en la app de pruebas.

#### Flujo de trabajo

1. **Código:** subir los cambios a `staging` (directo o con un pull request hacia `staging`). Vercel publica la versión de pruebas sola.
2. **Base de datos:** si el cambio trae una migración nueva, aplicarla **primero en el proyecto de pruebas** (SQL Editor o Claude Code por MCP). Lo mismo con Edge Functions nuevas o modificadas.
3. **Probar** en la app de pruebas.
4. **Pasar a producción:** aplicar la misma migración / función en **CliniPlus Project** y fusionar `staging` → `main` con un pull request. Vercel publica producción.
5. **Sincronizar:** si `main` recibe cambios que no pasaron por `staging` (por ejemplo un arreglo urgente), traerlos a `staging` con un pull request `main` → `staging`. **`staging` no se actualiza sola.**

Reglas:

- Nunca poner las variables de producción en *Preview* sin rama, ni las de pruebas en *Production*.
- Los usuarios, clínicas y solicitudes de un ambiente no existen en el otro.
- El ambiente de pruebas no tiene copia de los datos reales. No copiar datos de pacientes reales a pruebas.

---

## 12. Operación: usuarios, clínicas y migraciones

Estas tareas se hacen en el panel de Supabase (**SQL Editor** para el SQL) o pidiéndoselas a Claude Code, que tiene acceso por MCP (ver §13).

### 12.1 Dar acceso a una persona

1. Crear el usuario: *Authentication → Users → Add user → Create new user* (correo + contraseña, marcar *Auto Confirm User*), o *Send invitation* para que elija su contraseña.
2. Asignarlo a una clínica:

```sql
insert into public.clinic_members (clinic_id, user_id, role)
select '6736ae2a-6ab1-4ef4-9e52-876258092f19', id, 'staff'
from auth.users where email = 'persona@ejemplo.com';
```

(Usar `28c51a1a-cacc-463b-a946-009f1a328fdb` para Demo MCVD; `owner` en lugar de `staff` para responsables.)

### 12.2 Quitar acceso

```sql
delete from public.clinic_members
where user_id = (select id from auth.users where email = 'persona@ejemplo.com');
```

Para bloquear del todo, eliminar también el usuario en *Authentication → Users*.

### 12.3 Restablecer una contraseña

*Authentication → Users →* (usuario) *→ Send password recovery*. La app no tiene todavía pantalla de "olvidé mi contraseña" propia; el enlace del correo lleva a la *Site URL* configurada.

### 12.4 Crear otra clínica

```sql
insert into public.clinics (name, demo_data) values ('Nueva Clínica', false) returning id;
```

Después asignar usuarios con el `id` devuelto (§12.1).

### 12.5 Ver las fichas enviadas por pacientes

No hay pantalla en la app todavía. En *Table Editor → patient_form_submissions*, o:

```sql
select submitted_at, patient_ref, data->>'name' as nombre, data->>'phone' as telefono, data
from public.patient_form_submissions
where clinic_id = '6736ae2a-6ab1-4ef4-9e52-876258092f19' and reviewed_at is null
order by submitted_at desc;
```

Marcar como revisada:

```sql
update public.patient_form_submissions set reviewed_at = now() where id = '<id>';
```

### 12.6 Copias de seguridad

Supabase hace copias diarias según el plan contratado (*Database → Backups*). Para una copia manual de los datos de una clínica:

```sql
select collection, value, updated_at
from public.clinic_data where clinic_id = '6736ae2a-6ab1-4ef4-9e52-876258092f19';
```

Exportar el resultado a CSV/JSON desde el SQL Editor.

### 12.7 Cambios de esquema

- Probar primero en el ambiente de pruebas (§11.5).
- Cada cambio va en un archivo nuevo en `supabase/migrations/` con prefijo de fecha `YYYYMMDDHHMMSS_descripcion.sql`, y se aplica en el proyecto (SQL Editor, CLI de Supabase o Claude Code por MCP).
- Toda tabla nueva en `public` debe tener RLS activado y políticas antes de usarse.
- Después de cada cambio, revisar *Advisors → Security* en Supabase.

---

### 12.8 Registro de clínicas nuevas (autoservicio con aprobación)

Flujo:

1. La persona entra a `/registro` (enlace "Solicita acceso" en el login) y escribe clínica, nombre, teléfono, correo y contraseña.
2. La Edge Function **`clinic-signup`** (pública, `verify_jwt = false`):
   - valida los datos (contraseña de 8 a 72 caracteres) y limita a 20 solicitudes por hora;
   - crea el usuario en Supabase Auth con su contraseña (`email_confirm: true`, porque la aprobación manual reemplaza la confirmación de correo);
   - guarda la fila en **`clinic_requests`** con `status = 'pending'` y el **sha256** de un código aleatorio de 64 caracteres;
   - envía un correo a `ADMIN_EMAIL` (por defecto lemarealejandro@gmail.com) con el enlace `APP_URL/aprobar-clinica?id=…&token=…`.
3. El administrador abre el enlace. La página `/aprobar-clinica` llama a la Edge Function **`clinic-approval`** (`view`, `approve` o `reject`), que comprueba el código contra el hash (comparación en tiempo constante, vence a los 30 días).
4. Al aprobar, la función SQL `public.approve_clinic_request(id)` crea la clínica (`demo_data = false`), asigna al usuario como `owner` y marca la solicitud `approved`, todo en una transacción.
5. Desde ese momento la persona entra en `/login` con su correo y contraseña. Antes de la aprobación el login muestra "pendiente de aprobación".

Tabla `clinic_requests`: `id`, `user_id` (único), `clinic_name`, `contact_name`, `phone`, `email`, `status` (`pending`/`approved`/`rejected`), `token_hash`, `token_expires_at`, `clinic_id`, `notified_at`, `created_at`, `reviewed_at`. RLS: el usuario solo lee su propia solicitud y nunca la columna `token_hash`; nadie escribe desde el navegador.

Secretos de las Edge Functions (*Edge Functions → Secrets*):

| Secreto | Obligatorio | Uso |
|---|---|---|
| `RESEND_API_KEY` | Sí, para el correo | Clave de [Resend](https://resend.com). Sin ella la solicitud se guarda pero no llega correo |
| `APP_URL` | Recomendado | URL pública de la app (p. ej. `https://mcvd.vercel.app`) para el enlace de aprobación |
| `ADMIN_EMAIL` | No | Destinatario de las solicitudes |
| `RESEND_FROM` | No | Remitente con dominio verificado en Resend. Sin él se usa `onboarding@resend.dev`, que solo puede enviar al correo dueño de la cuenta de Resend, y no se avisa al solicitante |

Código: `supabase/functions/clinic-signup/`, `supabase/functions/clinic-approval/`, `supabase/migrations/20261118170000_clinic_requests.sql`, `src/pages/Registro.jsx`, `src/pages/AprobarClinica.jsx`.

Ver solicitudes pendientes sin correo:

```sql
select created_at, clinic_name, contact_name, email, phone, notified_at
from public.clinic_requests where status = 'pending' order by created_at desc;
```

Aprobar a mano (SQL Editor):

```sql
select public.approve_clinic_request('<id de la solicitud>');
```

### 12.9 Panel de administración de la plataforma

Ruta `/plataforma`. Lo usan los **administradores de la plataforma** (tabla `platform_admins`), que no necesitan pertenecer a una clínica.

- **Login:** `login()` comprueba también `platform_admins`. Si el usuario es administrador y no tiene clínica, entra directo a `/plataforma`. Si además tiene clínica, entra a su clínica y ve el enlace **Administración** en el menú lateral.
- **Qué muestra:** contadores (solicitudes pendientes, clínicas, usuarios), las solicitudes con botones **Aprobar / Rechazar** y la lista de clínicas con sus usuarios (rol y último ingreso) y la fecha de la última modificación de datos.
- **Qué NO muestra:** pacientes ni ningún dato clínico. El administrador no es miembro de las clínicas y RLS le impide leer `clinic_data` y `patient_form_submissions`.

Base de datos (migración `20261118180000_platform_admins.sql`):

| Objeto | Descripción |
|---|---|
| `public.platform_admins(user_id, created_at)` | Administradores. RLS: cada usuario solo puede ver su propia fila |
| `private.is_platform_admin()` | `security definer`: ¿el usuario actual es administrador? |
| `public.admin_overview()` | Devuelve `{ requests, clinics }` en JSON. Rechaza (`42501`) a quien no sea administrador |
| `public.admin_review_clinic_request(req_id, decision)` | `decision` = `approve` o `reject`. Rechaza a quien no sea administrador; no revisa dos veces la misma solicitud |

El asesor de Supabase avisa que estas dos funciones son `security definer` ejecutables por `authenticated`: es intencional, porque ambas comprueban `is_platform_admin()` antes de hacer nada. Se probaron 10 casos (usuario normal, administrador y anónimo) el 2026-11-18.

Al aprobar desde el panel **no se envía correo** al solicitante (igual que desde el enlace del correo sin dominio propio en Resend): hay que avisarle.

**Dar o quitar el rol de administrador** (SQL Editor):

```sql
insert into public.platform_admins (user_id)
select id from auth.users where email = 'persona@ejemplo.com';
```

```sql
delete from public.platform_admins
where user_id = (select id from auth.users where email = 'persona@ejemplo.com');
```

---

## 13. Herramientas para Claude Code

- **`.mcp.json`**: registra el servidor MCP de Supabase (`https://mcp.supabase.com/mcp?project_ref=elsgbeupmvsqwkdiineb&…`). Permite a Claude Code consultar tablas, aplicar migraciones, revisar logs y advisors. En local requiere autenticarse una vez con `/mcp` → *supabase* → *Authenticate*. En sesiones de Claude Code en la nube se usa el conector de Supabase de claude.ai.
- **`.claude/skills/`**: skills oficiales de Supabase (`supabase`, `supabase-postgres-best-practices`) con buenas prácticas de esquema, RLS y rendimiento. Versiones fijadas en `skills-lock.json`.

---

## 14. Limitaciones conocidas

### 14.1 Datos y concurrencia

1. **Última escritura gana:** dos personas editando la misma sección a la vez pueden pisarse cambios (§5.3).
2. **Sin tiempo real:** los cambios de otra persona se ven al recargar o volver a entrar a la pantalla.
3. **Errores de guardado silenciosos:** si falla la conexión, el cambio queda solo en la caché local del navegador y se registra en consola, sin aviso visible.
4. **Imágenes y firmas en base64** dentro de `clinicplus_patients` y `clinicplus_estudios`: hacen crecer la colección. Deberían ir a Supabase Storage.
5. **Presupuesto sin persistencia:** los ítems del presupuesto (`TreatmentsTab` → `budgetItems`) viven solo en memoria y se pierden al salir de la ficha.
6. **Informes radiológicos con datos de ejemplo** (`mockInformes`): no se crean ni guardan desde la app.
7. **Citas sin sucursal:** los reportes no pueden filtrar citas por sede.

### 14.2 Funcionalidad

8. **Sin pantalla para fichas de pacientes recibidas** (se ven en Supabase, §12.5).
9. **Sin "olvidé mi contraseña"** en la app. Las clínicas nuevas se registran solas con aprobación (§12.8), pero agregar más personas a una clínica existente sigue siendo manual (§12.1).
10. **Roles sin efecto dentro de la clínica:** `owner` y `staff` tienen los mismos permisos. El único rol distinto es el de administrador de la plataforma (§12.9).
11. **Un usuario = una clínica activa** (sin selector).
12. **Link de pago simulado** (§9.4).
13. **Enlaces de formulario antiguos** (sin `?c=`) no permiten enviar.

### 14.3 Calidad

14. **Sin pruebas automatizadas** de frontend; solo `lint` y `build`. Las pruebas de RLS de §6.3 se ejecutaron a mano.
15. **Ambiente de pruebas manual:** existe (§11.5), pero las migraciones y funciones se aplican a mano en cada proyecto y `staging` hay que sincronizarla con `main` a mano.
16. **Estilos mezclados** (CSS global, inline y Tailwind) y **dos librerías de PDF**.

---

## 15. Próximos pasos recomendados

En orden de impacto:

1. **Pantalla de fichas recibidas** en la app (leer `patient_form_submissions`, importar al paciente, marcar revisada).
2. **Aviso visible de errores de guardado** y estado "guardando / guardado".
3. **Recuperación de contraseña** en la pantalla de login (`supabase.auth.resetPasswordForEmail`).
4. **Archivos a Supabase Storage** (firmas, imágenes de estudios, PDFs) con políticas por clínica.
5. **Normalizar pacientes y citas** en tablas propias (hay una propuesta completa, con roles por clínica, auditoría y Storage, en [`docs/backend-normalizado-propuesta/`](../docs/backend-normalizado-propuesta/LEEME.md); no está aplicada) cuando crezca el uso o haya varias personas editando a la vez; añadir auditoría de cambios en fichas clínicas.
6. **Automatizar el ambiente de pruebas** (§11.5): aplicar migraciones y desplegar funciones desde GitHub Actions al subir a `staging` y a `main`.
7. **Pruebas automatizadas** de aislamiento entre clínicas (RLS) en CI.
8. Revisión legal de cumplimiento para datos de salud (ficha clínica, protección de datos personales, contrato de encargo de tratamiento con los proveedores: Supabase, Vercel, EmailJS).

---

## 16. Glosario

- **Clínica / tenant:** organización con datos aislados (`clinics`).
- **Miembro:** usuario de Supabase Auth asignado a una clínica (`clinic_members`).
- **Colección:** cada conjunto de datos de la app (pacientes, citas…), guardado como una fila de `clinic_data`.
- **RLS (Row Level Security):** reglas de PostgreSQL que filtran qué filas puede leer o escribir cada usuario.
- **Clave publicable:** clave de Supabase pensada para el navegador; por sí sola no da acceso a datos protegidos por RLS.
- **`service_role` / clave secreta:** clave de administrador de Supabase que ignora RLS. Nunca debe ir al frontend.
- **MCP:** *Model Context Protocol*; permite a Claude Code operar sobre Supabase.
