-- Esquema de CliniPlus: clínicas, miembros, datos de la app y fichas de pacientes.
-- Todas las tablas tienen RLS: cada usuario solo accede a los datos de su clínica.

create schema if not exists private;

-- Clínicas. demo_data = true arranca con los datos de ejemplo de la app.
create table public.clinics (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(name) between 1 and 200),
  demo_data boolean not null default false,
  created_at timestamptz not null default now()
);

-- Qué usuario (Supabase Auth) pertenece a qué clínica.
create table public.clinic_members (
  clinic_id uuid not null references public.clinics (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'staff' check (role in ('owner', 'staff')),
  created_at timestamptz not null default now(),
  primary key (clinic_id, user_id)
);
create index clinic_members_user_id_idx on public.clinic_members (user_id);

-- Datos de la app: una fila por colección (pacientes, agenda, inventario, ...) y clínica.
create table public.clinic_data (
  clinic_id uuid not null references public.clinics (id) on delete cascade,
  collection text not null check (collection ~ '^[a-z0-9_]{1,64}$'),
  value jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid default auth.uid() references auth.users (id) on delete set null,
  primary key (clinic_id, collection)
);
create index clinic_data_updated_by_idx on public.clinic_data (updated_by);

-- Fichas que el paciente llena desde el enlace público.
create table public.patient_form_submissions (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics (id) on delete cascade,
  patient_ref text check (length(patient_ref) <= 100),
  data jsonb not null check (pg_column_size(data) < 100000),
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz
);
create index patient_form_submissions_clinic_id_idx on public.patient_form_submissions (clinic_id, submitted_at desc);

-- updated_at / updated_by automáticos.
create function private.touch_clinic_data() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  new.updated_by := auth.uid();
  return new;
end;
$$;
create trigger clinic_data_touch before insert or update on public.clinic_data
  for each row execute function private.touch_clinic_data();

-- ¿El usuario actual es miembro de la clínica? (security definer: evita recursión de RLS)
create function private.is_clinic_member(cid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.clinic_members
    where clinic_id = cid and user_id = (select auth.uid())
  );
$$;

-- ¿Existe la clínica? Lo usa el formulario público, que no puede leer clinics.
create function private.clinic_exists(cid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.clinics where id = cid);
$$;

revoke all on function private.is_clinic_member(uuid) from public, anon;
revoke all on function private.clinic_exists(uuid) from public;
revoke all on function private.touch_clinic_data() from public, anon, authenticated;
grant usage on schema private to anon, authenticated;
grant execute on function private.is_clinic_member(uuid) to authenticated;
grant execute on function private.clinic_exists(uuid) to anon, authenticated;

-- Permisos de tabla (mínimos) + RLS.
revoke all on public.clinics, public.clinic_members, public.clinic_data, public.patient_form_submissions from anon, authenticated;
grant select on public.clinics, public.clinic_members to authenticated;
grant select, insert, update, delete on public.clinic_data to authenticated;
grant insert on public.patient_form_submissions to anon, authenticated;
grant select, update, delete on public.patient_form_submissions to authenticated;

alter table public.clinics enable row level security;
alter table public.clinic_members enable row level security;
alter table public.clinic_data enable row level security;
alter table public.patient_form_submissions enable row level security;

create policy "Miembros ven su clínica" on public.clinics
  for select to authenticated using ((select private.is_clinic_member(id)));

create policy "Usuarios ven sus membresías" on public.clinic_members
  for select to authenticated using (user_id = (select auth.uid()));

create policy "Miembros leen datos de su clínica" on public.clinic_data
  for select to authenticated using ((select private.is_clinic_member(clinic_id)));
create policy "Miembros crean datos de su clínica" on public.clinic_data
  for insert to authenticated with check ((select private.is_clinic_member(clinic_id)));
create policy "Miembros editan datos de su clínica" on public.clinic_data
  for update to authenticated
  using ((select private.is_clinic_member(clinic_id)))
  with check ((select private.is_clinic_member(clinic_id)));
create policy "Miembros borran datos de su clínica" on public.clinic_data
  for delete to authenticated using ((select private.is_clinic_member(clinic_id)));

create policy "Cualquiera envía una ficha a una clínica existente" on public.patient_form_submissions
  for insert to anon, authenticated
  with check (reviewed_at is null and (select private.clinic_exists(clinic_id)));
create policy "Miembros leen fichas de su clínica" on public.patient_form_submissions
  for select to authenticated using ((select private.is_clinic_member(clinic_id)));
create policy "Miembros marcan fichas revisadas" on public.patient_form_submissions
  for update to authenticated
  using ((select private.is_clinic_member(clinic_id)))
  with check ((select private.is_clinic_member(clinic_id)));
create policy "Miembros borran fichas de su clínica" on public.patient_form_submissions
  for delete to authenticated using ((select private.is_clinic_member(clinic_id)));
