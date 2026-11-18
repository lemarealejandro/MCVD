# ClinicPlus · Backend en Supabase

Base de datos Postgres con autenticación, aislamiento por clínica (RLS), auditoría, almacenamiento de archivos y el formulario de paciente por enlace.

Estado: esquema, seguridad y pruebas listos y verificados en Postgres 16 local. **Aún no está conectado a la app** (la app sigue guardando en `localStorage`) y **no se ha aplicado a un proyecto Supabase real**.

## Estructura

```
supabase/
  migrations/
    20261118000001_schema.sql         tablas, claves, índices, restricciones
    20261118000002_security.sql       roles, RLS por clínica, RPC create_clinic / invite_member
    20261118000003_audit.sql          triggers de auditoría
    20261118000004_storage_intake.sql bucket privado, políticas de Storage, enlaces de formulario
  seed/
    01_treatment_catalog.sql          catálogo global (generado desde src/data/treatmentCatalog.js)
  tests/
    rls_isolation.sql                 pruebas de aislamiento entre clínicas y permisos por rol
    local/00_supabase_shim.sql        SOLO para Postgres local sin Supabase (simula auth y storage)
```

## Modelo de acceso

Cada tabla de negocio lleva `clinic_id`. Un usuario ve una clínica solo si tiene una fila en `memberships`.

| Rol | Lee | Escribe |
|---|---|---|
| `admin` | todo de su clínica, auditoría | todo, incluido configuración, profesionales, liquidaciones, gastos, convenios, miembros |
| `dentista` | todo de su clínica | ficha clínica, odontograma, periodontograma, tratamientos, presupuestos, imágenes, informes, agenda, pacientes, inventario, laboratorio |
| `recepcion` | todo de su clínica | pacientes, citas, inventario, laboratorio, enlaces de formulario |
| `solo_lectura` | todo de su clínica | nada |
| super-admin (`platform_admins`) | lista de clínicas | estado comercial y plan de cualquier clínica; **no ve fichas clínicas** |
| anónimo | nada | solo `submit_patient_intake` con un token válido |

Las áreas están en `app_can(clinic_id, area)`: `read`, `operations`, `clinical`, `admin`.

## Mapa desde la app actual

| Clave de `localStorage` (hoy) | Tabla(s) |
|---|---|
| `clinicplus_patients` | `patients`, `clinical_histories`, `odontogram_teeth`, `perio_teeth`, `treatments_done`, `consents`, `budgets` + `budget_items` |
| `clinicplus_appointments` | `appointments` |
| `clinicplus_inventory` | `inventory_items` |
| `clinicplus_estudios` | `imaging_studies` |
| `clinicplus_plantillas` | `report_templates` |
| `clinicplus_settings` | columnas de `clinics` |
| `clinicplus_sucursales` | `branches` |
| `clinicplus_gastos` | `expenses` |
| `clinicplus_laboratorio` | `lab_orders` |
| `clinicplus_convenios` | `agreements` |
| `clinicplus_profesionales` | `professionals` |
| `clinicplus_liquidaciones` | `liquidations` |
| `patient_form_<timestamp>` (navegador del paciente) | `intake_submissions` |
| (no existía) | `audit_log`, `email_log`, `memberships`, `intake_links` |

Decisiones de modelado que cambian la forma de los datos:

- **Odontograma:** una fila por pieza FDI. Las caras son columnas con catálogo (`caries`, `filling`, `crown`, `planned`). El catálogo de diagnóstico va en `diagnosis_codes`. "Creador" y "fecha" pasan a `updated_by` y `updated_at` (claves reales en lugar de texto).
- **Presupuesto:** persiste (hoy se pierde al recargar). `line_total_usd` y el total los calcula la base de datos, para que el PDF y los reportes coincidan.
- **Liquidaciones:** el porcentaje se copia en `pct_snapshot`. Cambiar el porcentaje del profesional no reescribe liquidaciones pasadas. El monto también lo calcula la base.
- **Citas:** `sucursal` existe (`branch_id`), lo que permite filtrar reportes por sede. `patient_id` es opcional porque la app permite citas con nombre libre.
- **Firmas y archivos:** no van en base64 en la fila; van a Storage (`clinic-files/{clinic_id}/...`).
- **Pacientes:** baja lógica (`deleted_at`). Un RUT es único por clínica.
- **Listas clínicas** (alergias, medicamentos, hábitos): `text[]`. Si luego se necesitan reportes sobre ellas, conviene normalizarlas.

## Formulario de paciente

El personal crea un enlace con `create_intake_link(patient_id)`, que devuelve un token de un solo uso (vence a los 14 días). Solo se guarda su hash SHA-256. El paciente envía el formulario con `submit_patient_intake(token, payload)`, sin cuenta. El personal lo revisa en `intake_submissions`.

Esto corrige el punto 8.1 del documento técnico: la respuesta llega a la clínica y no se queda en el navegador del paciente.

## Aplicar en Supabase

1. Crear un proyecto en Supabase. Para datos de salud, elegir la región con más cuidado y revisar la política de residencia de datos con asesoría legal (ver sección 9.6 del documento técnico).
2. Instalar la CLI y vincular el proyecto:
   ```
   supabase link --project-ref <ref>
   supabase db push
   ```
   `db push` aplica `migrations/` en orden. Si el proyecto no tiene `config.toml`, ejecutar antes `supabase init`; no sobrescribe las migraciones.
3. Aplicar la semilla del catálogo (una vez, o al cambiar `treatmentCatalog.js`):
   ```
   psql "$DATABASE_URL" -f supabase/seed/01_treatment_catalog.sql
   ```
4. Crear el super-admin del proveedor (manual, una sola vez, desde el SQL editor):
   ```sql
   insert into public.platform_admins (user_id) values ('<uuid del usuario>');
   ```
5. Primera clínica: el usuario se registra en Auth y llama `select public.create_clinic('Nombre de la clínica');`. Quien la crea queda como `admin`.

### Variables para el frontend

```
VITE_SUPABASE_URL=https://<ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon key>
```

Nunca usar la `service_role` key en el navegador: salta RLS. Tampoco va en el repositorio.

## Pruebas

Contra un proyecto de prueba (staging), con migraciones aplicadas:

```
psql "$STAGING_DB_URL" -v ON_ERROR_STOP=1 -f supabase/tests/rls_isolation.sql
```

Todo corre en una transacción que se revierte; no deja datos. Si una prueba falla, aborta con `FAIL ...`.

Localmente, sin Supabase (Postgres 16):

```
psql "$LOCAL_DB" -f supabase/tests/local/00_supabase_shim.sql
for f in supabase/migrations/*.sql supabase/seed/*.sql; do psql "$LOCAL_DB" -v ON_ERROR_STOP=1 -f "$f"; done
psql "$LOCAL_DB" -v ON_ERROR_STOP=1 -f supabase/tests/rls_isolation.sql
```

La suite tiene 64 comprobaciones de aislamiento, permisos por rol, auditoría, Storage, formulario por enlace, restricciones y cálculos. Se verificó que detecta un fallo real: con RLS desactivado en `patients`, la prueba falla.

## Pendiente (no incluido)

- **Conectar la app.** Reemplazar `usePersistentState` por un cliente de datos y el login por Supabase Auth. Es el paso más grande y depende de este esquema.
- **Migrar datos existentes.** Script que lea el JSON exportado de `localStorage` y lo cargue en el tenant correspondiente.
- **Correos.** Hoy EmailJS se llama desde el navegador. Debe pasar a una Edge Function que escriba en `email_log`.
- **Citas sin solapar.** Agregar una restricción de exclusión por profesional y horario (requiere la extensión `btree_gist`).
- **Límite de intentos del formulario.** La RPC no limita llamadas repetidas. Conviene un límite por IP en una Edge Function o un captcha.
- **MFA y políticas de contraseña.** Se configuran en Auth del proyecto, no en SQL.
- **Copias de seguridad.** Activar backups de punto en el tiempo del plan de Supabase y probar una restauración.
- **Facturación y planes.** `clinics.plan` y `status` existen, pero no hay suscripciones ni pagos.
- **Retención.** La baja lógica de pacientes no borra nada. Falta el procedimiento de retención y eliminación al término del contrato (Decreto 41, sección 9.6).
- **Integración en CI.** Ejecutar `rls_isolation.sql` en cada cambio de migraciones.
