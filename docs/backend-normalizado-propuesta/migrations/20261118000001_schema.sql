-- ClinicPlus · Esquema base multi-clínica
-- Cada tabla de negocio lleva clinic_id. El aislamiento lo aplica RLS (migración 002).

-- ── Clínicas, usuarios y roles ───────────────────────────────────────────────

create table public.clinics (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null check (length(trim(name)) > 0),
  email               text,
  phone               text,
  address             text,
  currency            text not null default 'USD' check (currency in ('USD', 'VES', 'CLP')),
  low_stock_alerts    boolean not null default true,
  appointment_alerts  boolean not null default true,
  -- Estado comercial: solo lo cambia el super-admin del proveedor (ver 002).
  status              text not null default 'activa' check (status in ('activa', 'gracia', 'suspendida', 'cancelada')),
  plan                text not null default 'esencial',
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- Perfil público del usuario de Supabase Auth.
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text,
  created_at  timestamptz not null default now()
);

-- Super-admin del proveedor: administra clínicas, nunca ve fichas clínicas.
create table public.platform_admins (
  user_id     uuid primary key references auth.users (id) on delete cascade,
  created_at  timestamptz not null default now()
);

-- Un usuario puede pertenecer a varias clínicas, cada una con un rol.
create table public.memberships (
  id          uuid primary key default gen_random_uuid(),
  clinic_id   uuid not null references public.clinics (id) on delete cascade,
  user_id     uuid not null references auth.users (id) on delete cascade,
  role        text not null check (role in ('admin', 'dentista', 'recepcion', 'solo_lectura')),
  created_at  timestamptz not null default now(),
  unique (clinic_id, user_id)
);
create index memberships_user_idx on public.memberships (user_id);

-- ── Operación de la clínica ─────────────────────────────────────────────────

-- Sucursales (antes: clinicplus_sucursales).
create table public.branches (
  id           uuid primary key default gen_random_uuid(),
  clinic_id    uuid not null references public.clinics (id) on delete cascade,
  name         text not null check (length(trim(name)) > 0),
  address      text,
  manager      text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index branches_clinic_idx on public.branches (clinic_id);

-- Profesionales. user_id se llena si el profesional tiene usuario en la app.
create table public.professionals (
  id                uuid primary key default gen_random_uuid(),
  clinic_id         uuid not null references public.clinics (id) on delete cascade,
  user_id           uuid references auth.users (id) on delete set null,
  name              text not null check (length(trim(name)) > 0),
  specialty         text,
  liquidation_pct   numeric(5, 2) not null default 0 check (liquidation_pct between 0 and 100),
  active            boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index professionals_clinic_idx on public.professionals (clinic_id);

-- ── Pacientes y ficha clínica ───────────────────────────────────────────────

create table public.patients (
  id                uuid primary key default gen_random_uuid(),
  clinic_id         uuid not null references public.clinics (id) on delete cascade,
  name              text not null check (length(trim(name)) > 0),
  rut               text,
  dob               date,
  age               integer check (age is null or age between 0 and 130),
  gender            text,
  phone             text,
  email             text,
  address           text,
  blood_type        text check (blood_type is null or blood_type in ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
  marital_status    text,
  occupation        text,
  education         text,
  emergency_contact text,
  emergency_phone   text,
  status            text not null default 'Activo' check (status in ('Activo', 'Inactivo')),
  last_visit        date,
  allergies         text[] not null default '{}',
  medications       text[] not null default '{}',
  chronic_diseases  text[] not null default '{}',
  -- Baja lógica: una ficha clínica nunca se borra físicamente antes del plazo legal.
  deleted_at        timestamptz,
  created_by        uuid references auth.users (id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index patients_clinic_idx on public.patients (clinic_id) where deleted_at is null;
create index patients_name_idx on public.patients (clinic_id, lower(name));
create unique index patients_rut_uniq on public.patients (clinic_id, rut)
  where rut is not null and deleted_at is null;

-- Historia clínica: 1 a 1 con el paciente.
create table public.clinical_histories (
  patient_id           uuid primary key references public.patients (id) on delete cascade,
  clinic_id            uuid not null references public.clinics (id) on delete cascade,
  reason_for_visit     text,
  current_illness      text,
  dental_history       text,
  family_history       text[] not null default '{}',
  habits               text[] not null default '{}',
  extraoral_exam       text,
  intraoral_exam       text,
  occlusal_exam        text,
  diagnosis            text,
  treatment_plan       text,
  blood_pressure       text,
  heart_rate           text,
  weight_kg            numeric(6, 2) check (weight_kg is null or weight_kg > 0),
  height_cm            numeric(5, 1) check (height_cm is null or height_cm > 0),
  vitals_checked_on    date,
  updated_by           uuid references auth.users (id) on delete set null,
  updated_at           timestamptz not null default now()
);
create index clinical_histories_clinic_idx on public.clinical_histories (clinic_id);

-- Consentimiento informado. La firma es un archivo en Storage, no base64 en la fila.
create table public.consents (
  id                uuid primary key default gen_random_uuid(),
  clinic_id         uuid not null references public.clinics (id) on delete cascade,
  patient_id        uuid not null references public.patients (id) on delete cascade,
  signed_name       text,
  signed_at         timestamptz not null default now(),
  signature_path    text,
  created_by        uuid references auth.users (id) on delete set null,
  created_at        timestamptz not null default now()
);
create index consents_patient_idx on public.consents (patient_id, signed_at desc);

-- Odontograma: una fila por pieza (FDI). Permanente 11–48, temporal 51–85.
create table public.odontogram_teeth (
  id            uuid primary key default gen_random_uuid(),
  clinic_id     uuid not null references public.clinics (id) on delete cascade,
  patient_id    uuid not null references public.patients (id) on delete cascade,
  tooth_fdi     smallint not null,
  dentition     text not null check (dentition in ('permanente', 'temporal')),
  -- Condiciones por cara, según la vista oclusal de 5 superficies de la app.
  surf_top      text check (surf_top    in ('caries', 'filling', 'crown', 'planned')),
  surf_bottom   text check (surf_bottom in ('caries', 'filling', 'crown', 'planned')),
  surf_left     text check (surf_left   in ('caries', 'filling', 'crown', 'planned')),
  surf_right    text check (surf_right  in ('caries', 'filling', 'crown', 'planned')),
  surf_center   text check (surf_center in ('caries', 'filling', 'crown', 'planned')),
  absent        boolean not null default false,
  -- Catálogo de diagnóstico: preexistencias, lesiones, otros diagnósticos y estados.
  diagnosis_codes text[] not null default '{}',
  updated_by    uuid references auth.users (id) on delete set null,
  updated_at    timestamptz not null default now(),
  unique (patient_id, tooth_fdi),
  check ((tooth_fdi between 11 and 48 and dentition = 'permanente')
      or (tooth_fdi between 51 and 85 and dentition = 'temporal'))
);
create index odontogram_clinic_idx on public.odontogram_teeth (clinic_id);

-- Periodontograma: sondaje en 6 puntos por pieza.
create table public.perio_teeth (
  id              uuid primary key default gen_random_uuid(),
  clinic_id       uuid not null references public.clinics (id) on delete cascade,
  patient_id      uuid not null references public.patients (id) on delete cascade,
  tooth_fdi       smallint not null check (tooth_fdi between 11 and 85),
  probing_mm      smallint[] not null default '{0,0,0,0,0,0}' check (array_length(probing_mm, 1) = 6),
  bleeding        boolean[]  not null default '{f,f,f,f,f,f}' check (array_length(bleeding, 1) = 6),
  suppuration     boolean[]  not null default '{f,f,f,f,f,f}' check (array_length(suppuration, 1) = 6),
  recession_mm    smallint[] not null default '{0,0,0,0,0,0}' check (array_length(recession_mm, 1) = 6),
  mobility        smallint not null default 0 check (mobility between 0 and 3),
  furcation       smallint not null default 0 check (furcation between 0 and 3),
  implant         boolean not null default false,
  absent          boolean not null default false,
  plaque          boolean not null default false,
  updated_by      uuid references auth.users (id) on delete set null,
  updated_at      timestamptz not null default now(),
  unique (patient_id, tooth_fdi)
);
create index perio_clinic_idx on public.perio_teeth (clinic_id);

-- Tratamientos realizados (historial de la ficha).
create table public.treatments_done (
  id               uuid primary key default gen_random_uuid(),
  clinic_id        uuid not null references public.clinics (id) on delete cascade,
  patient_id       uuid not null references public.patients (id) on delete cascade,
  performed_on     date not null default current_date,
  procedure_name   text not null check (length(trim(procedure_name)) > 0),
  tooth            text,
  notes            text,
  professional_id  uuid references public.professionals (id) on delete set null,
  created_by       uuid references auth.users (id) on delete set null,
  created_at       timestamptz not null default now()
);
create index treatments_patient_idx on public.treatments_done (patient_id, performed_on desc);

-- ── Catálogo y presupuestos ─────────────────────────────────────────────────

-- clinic_id NULL = catálogo global del proveedor (semilla); con clinic_id = propio de la clínica.
create table public.treatment_catalog (
  id          uuid primary key default gen_random_uuid(),
  clinic_id   uuid references public.clinics (id) on delete cascade,
  code        text not null,
  category    text not null,
  name        text not null,
  unit        text,
  price_usd   numeric(10, 2) not null check (price_usd >= 0),
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique nulls not distinct (clinic_id, code)
);

create table public.budgets (
  id            uuid primary key default gen_random_uuid(),
  clinic_id     uuid not null references public.clinics (id) on delete cascade,
  patient_id    uuid not null references public.patients (id) on delete cascade,
  status        text not null default 'borrador' check (status in ('borrador', 'enviado', 'aceptado', 'rechazado')),
  exchange_rate numeric(12, 4) check (exchange_rate is null or exchange_rate > 0),
  notes         text,
  signature_path text,
  signed_at      timestamptz,
  sent_at        timestamptz,
  created_by     uuid references auth.users (id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index budgets_patient_idx on public.budgets (patient_id, created_at desc);

-- El total se calcula en la base de datos para que el PDF y los reportes coincidan.
create table public.budget_items (
  id              uuid primary key default gen_random_uuid(),
  clinic_id       uuid not null references public.clinics (id) on delete cascade,
  budget_id       uuid not null references public.budgets (id) on delete cascade,
  catalog_id      uuid references public.treatment_catalog (id) on delete set null,
  name            text not null,
  unit            text,
  unit_price_usd  numeric(10, 2) not null check (unit_price_usd >= 0),
  qty             integer not null default 1 check (qty >= 1),
  line_total_usd  numeric(12, 2) generated always as (round(unit_price_usd * qty, 2)) stored,
  position        integer not null default 0
);
create index budget_items_budget_idx on public.budget_items (budget_id, position);

-- ── Agenda ─────────────────────────────────────────────────────────────────

create table public.appointments (
  id                    uuid primary key default gen_random_uuid(),
  clinic_id             uuid not null references public.clinics (id) on delete cascade,
  branch_id             uuid references public.branches (id) on delete set null,
  patient_id            uuid references public.patients (id) on delete set null,
  -- La app permite citas con nombre libre; patient_id se enlaza cuando existe la ficha.
  patient_name          text not null check (length(trim(patient_name)) > 0),
  patient_email         text,
  patient_phone         text,
  professional_id       uuid references public.professionals (id) on delete set null,
  service               text not null,
  starts_on             date not null,
  starts_at_time        time not null,
  duration_min          integer not null default 60 check (duration_min between 5 and 480),
  status                text not null default 'Pendiente'
                        check (status in ('Pendiente', 'Confirmada', 'En Proceso', 'Completada', 'Cancelada')),
  notes                 text,
  confirmation_sent_at  timestamptz,
  reminder_sent_at      timestamptz,
  created_by            uuid references auth.users (id) on delete set null,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
create index appointments_day_idx on public.appointments (clinic_id, starts_on, starts_at_time);

-- ── Inventario, gastos, laboratorio, convenios, liquidaciones ──────────────

create table public.inventory_items (
  id           uuid primary key default gen_random_uuid(),
  clinic_id    uuid not null references public.clinics (id) on delete cascade,
  item         text not null check (length(trim(item)) > 0),
  category     text not null,
  quantity     integer not null default 0 check (quantity >= 0),
  min_stock    integer not null default 0 check (min_stock >= 0),
  price_usd    numeric(10, 2) not null default 0 check (price_usd >= 0),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index inventory_clinic_idx on public.inventory_items (clinic_id);

create table public.expenses (
  id           uuid primary key default gen_random_uuid(),
  clinic_id    uuid not null references public.clinics (id) on delete cascade,
  branch_id    uuid references public.branches (id) on delete set null,
  spent_on     date not null,
  category     text not null check (category in ('Arriendo', 'Sueldos', 'Insumos', 'Servicios básicos', 'Laboratorio externo', 'Marketing', 'Otros')),
  description  text not null check (length(trim(description)) > 0),
  amount_usd   numeric(12, 2) not null check (amount_usd >= 0),
  created_by   uuid references auth.users (id) on delete set null,
  created_at   timestamptz not null default now()
);
create index expenses_clinic_idx on public.expenses (clinic_id, spent_on);

create table public.lab_orders (
  id            uuid primary key default gen_random_uuid(),
  clinic_id     uuid not null references public.clinics (id) on delete cascade,
  branch_id     uuid references public.branches (id) on delete set null,
  patient_id    uuid references public.patients (id) on delete set null,
  patient_name  text not null,
  ordered_on    date not null,
  job           text not null,
  laboratory    text,
  status        text not null default 'Enviado' check (status in ('Enviado', 'En proceso', 'Recibido', 'Entregado')),
  cost_usd      numeric(12, 2) not null default 0 check (cost_usd >= 0),
  created_by    uuid references auth.users (id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index lab_clinic_idx on public.lab_orders (clinic_id, ordered_on);

create table public.agreements (
  id            uuid primary key default gen_random_uuid(),
  clinic_id     uuid not null references public.clinics (id) on delete cascade,
  name          text not null check (length(trim(name)) > 0),
  kind          text not null check (kind in ('Aseguradora', 'Empresa', 'Convenio particular', 'Otro')),
  discount_pct  numeric(5, 2) not null check (discount_pct between 0 and 100),
  active        boolean not null default true,
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Monto liquidado = honorarios × porcentaje, calculado por la base de datos.
-- El porcentaje se copia al crear la liquidación: cambiar el porcentaje del profesional no reescribe el pasado.
create table public.liquidations (
  id               uuid primary key default gen_random_uuid(),
  clinic_id        uuid not null references public.clinics (id) on delete cascade,
  professional_id  uuid not null references public.professionals (id) on delete restrict,
  branch_id        uuid references public.branches (id) on delete set null,
  period_on        date not null,
  gross_fees_usd   numeric(12, 2) not null check (gross_fees_usd >= 0),
  pct_snapshot     numeric(5, 2) not null check (pct_snapshot between 0 and 100),
  amount_usd       numeric(12, 2) generated always as (round(gross_fees_usd * pct_snapshot / 100, 2)) stored,
  status           text not null default 'Pendiente' check (status in ('Pendiente', 'Pagada')),
  created_by       uuid references auth.users (id) on delete set null,
  created_at       timestamptz not null default now()
);
create index liquidations_clinic_idx on public.liquidations (clinic_id, period_on);

-- ── Imagenología e informes ─────────────────────────────────────────────────

create table public.imaging_studies (
  id            uuid primary key default gen_random_uuid(),
  clinic_id     uuid not null references public.clinics (id) on delete cascade,
  patient_id    uuid references public.patients (id) on delete set null,
  patient_name  text not null,
  kind          text not null,
  taken_on      date not null,
  status        text not null default 'Pendiente' check (status in ('Pendiente', 'Informado')),
  file_path     text,
  created_by    uuid references auth.users (id) on delete set null,
  created_at    timestamptz not null default now()
);
create index studies_clinic_idx on public.imaging_studies (clinic_id, taken_on desc);

create table public.report_templates (
  id            uuid primary key default gen_random_uuid(),
  clinic_id     uuid not null references public.clinics (id) on delete cascade,
  name          text not null,
  specialty     text,
  blocks        jsonb not null default '[]'::jsonb check (jsonb_typeof(blocks) = 'array'),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table public.reports (
  id            uuid primary key default gen_random_uuid(),
  clinic_id     uuid not null references public.clinics (id) on delete cascade,
  study_id      uuid references public.imaging_studies (id) on delete set null,
  patient_id    uuid references public.patients (id) on delete set null,
  patient_name  text not null,
  rut           text,
  study_name    text,
  kind          text,
  report_date   date not null default current_date,
  physician     text,
  status        text not null default 'Borrador' check (status in ('Borrador', 'Pendiente', 'Finalizado')),
  blocks        jsonb not null default '[]'::jsonb check (jsonb_typeof(blocks) = 'array'),
  created_by    uuid references auth.users (id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index reports_clinic_idx on public.reports (clinic_id, report_date desc);

create table public.report_images (
  id            uuid primary key default gen_random_uuid(),
  clinic_id     uuid not null references public.clinics (id) on delete cascade,
  report_id     uuid not null references public.reports (id) on delete cascade,
  file_path     text not null,
  caption       text,
  position      integer not null default 0
);

-- ── Comunicaciones y trazabilidad de correos ───────────────────────────────

-- La app envía correos con EmailJS; aquí queda el registro central que hoy no existe.
create table public.email_log (
  id            uuid primary key default gen_random_uuid(),
  clinic_id     uuid not null references public.clinics (id) on delete cascade,
  kind          text not null check (kind in ('confirmacion', 'recordatorio', 'formulario', 'presupuesto')),
  recipient     text not null,
  appointment_id uuid references public.appointments (id) on delete set null,
  budget_id     uuid references public.budgets (id) on delete set null,
  patient_id    uuid references public.patients (id) on delete set null,
  status        text not null check (status in ('enviado', 'error')),
  error_message text,
  sent_by       uuid references auth.users (id) on delete set null,
  created_at    timestamptz not null default now()
);
create index email_log_clinic_idx on public.email_log (clinic_id, created_at desc);

-- Enlaces de la ficha que el paciente llena desde su celular.
-- Se guarda solo el hash del token; el token en claro se muestra una vez.
create table public.intake_links (
  id           uuid primary key default gen_random_uuid(),
  clinic_id    uuid not null references public.clinics (id) on delete cascade,
  patient_id   uuid not null references public.patients (id) on delete cascade,
  token_hash   text not null unique,
  expires_at   timestamptz not null default now() + interval '14 days',
  used_at      timestamptz,
  created_by   uuid references auth.users (id) on delete set null,
  created_at   timestamptz not null default now()
);

create table public.intake_submissions (
  id            uuid primary key default gen_random_uuid(),
  clinic_id     uuid not null references public.clinics (id) on delete cascade,
  patient_id    uuid not null references public.patients (id) on delete cascade,
  link_id       uuid references public.intake_links (id) on delete set null,
  payload       jsonb not null check (jsonb_typeof(payload) = 'object'),
  submitted_at  timestamptz not null default now(),
  reviewed_at   timestamptz,
  reviewed_by   uuid references auth.users (id) on delete set null
);
create index intake_clinic_idx on public.intake_submissions (clinic_id, submitted_at desc);

-- ── Auditoría ───────────────────────────────────────────────────────────────

create table public.audit_log (
  id          bigint generated always as identity primary key,
  clinic_id   uuid references public.clinics (id) on delete cascade,
  table_name  text not null,
  row_id      text not null,
  action      text not null check (action in ('INSERT', 'UPDATE', 'DELETE')),
  actor_id    uuid references auth.users (id) on delete set null,
  old_data    jsonb,
  new_data    jsonb,
  changed_at  timestamptz not null default now()
);
create index audit_clinic_idx on public.audit_log (clinic_id, changed_at desc);

-- ── updated_at automático ───────────────────────────────────────────────────

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

do $$
declare t text;
begin
  foreach t in array array[
    'clinics', 'branches', 'professionals', 'patients', 'treatment_catalog',
    'budgets', 'appointments', 'inventory_items', 'lab_orders', 'agreements',
    'report_templates', 'reports', 'clinical_histories', 'odontogram_teeth', 'perio_teeth'
  ] loop
    execute format(
      'create trigger %I before update on public.%I for each row execute function public.touch_updated_at()',
      t || '_touch', t
    );
  end loop;
end $$;
