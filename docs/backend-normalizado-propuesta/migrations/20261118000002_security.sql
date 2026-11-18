-- ClinicPlus · Seguridad: funciones de rol, RLS por clínica y RPC de alta.
--
-- Áreas de permiso (app_can):
--   read        cualquier miembro de la clínica
--   operations  admin, dentista, recepcion (agenda, pacientes, inventario, laboratorio)
--   clinical    admin, dentista (ficha clínica, odontograma, periodontograma, presupuestos, imágenes)
--   admin       solo admin (sucursales, profesionales, liquidaciones, gastos, convenios, miembros, configuración)
--
-- solo_lectura: solo área read.

-- ── Funciones auxiliares ────────────────────────────────────────────────────

create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.platform_admins where user_id = auth.uid());
$$;

create or replace function public.member_role(p_clinic uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select m.role from public.memberships m
  where m.clinic_id = p_clinic and m.user_id = auth.uid();
$$;

create or replace function public.app_can(p_clinic uuid, p_area text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select case p_area
    when 'read'       then public.member_role(p_clinic) is not null
    when 'operations' then public.member_role(p_clinic) in ('admin', 'dentista', 'recepcion')
    when 'clinical'   then public.member_role(p_clinic) in ('admin', 'dentista')
    when 'admin'      then public.member_role(p_clinic) = 'admin'
    else false
  end;
$$;

-- ── Perfil automático al registrarse ────────────────────────────────────────

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', new.email))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── Guardas de clínicas ────────────────────────────────────────────────────

-- Solo el super-admin del proveedor cambia estado comercial y plan.
create or replace function public.guard_clinic_commercial_fields()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (new.status is distinct from old.status or new.plan is distinct from old.plan)
     and not public.is_platform_admin() then
    raise exception 'Solo el proveedor puede cambiar el estado o el plan de la clínica'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists clinics_guard_commercial on public.clinics;
create trigger clinics_guard_commercial
  before update on public.clinics
  for each row execute function public.guard_clinic_commercial_fields();

-- ── RPC de alta: crear clínica e invitar miembros ─────────────────────────

-- Quien crea la clínica queda como admin. Evita el problema del huevo y la gallina con RLS.
create or replace function public.create_clinic(p_name text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if auth.uid() is null then
    raise exception 'No autenticado' using errcode = '42501';
  end if;
  insert into public.clinics (name) values (trim(p_name)) returning id into v_id;
  insert into public.memberships (clinic_id, user_id, role) values (v_id, auth.uid(), 'admin');
  return v_id;
end;
$$;

-- El admin invita a alguien que ya tiene cuenta (el email debe existir en Auth).
create or replace function public.invite_member(p_clinic uuid, p_email text, p_role text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid;
  v_id   uuid;
begin
  if not public.app_can(p_clinic, 'admin') then
    raise exception 'Solo un admin puede invitar miembros' using errcode = '42501';
  end if;
  select u.id into v_user from auth.users u where lower(u.email) = lower(trim(p_email));
  if v_user is null then
    raise exception 'No existe una cuenta con ese email. Debe registrarse primero.';
  end if;
  insert into public.memberships (clinic_id, user_id, role)
  values (p_clinic, v_user, p_role)
  on conflict (clinic_id, user_id) do update set role = excluded.role
  returning id into v_id;
  return v_id;
end;
$$;

-- ── Políticas RLS ───────────────────────────────────────────────────────────

alter table public.clinics              enable row level security;
alter table public.profiles             enable row level security;
alter table public.platform_admins      enable row level security;
alter table public.memberships          enable row level security;
alter table public.audit_log            enable row level security;

-- clinics: miembros leen; admin de la clínica edita configuración; super-admin ve todas.
create policy clinics_select on public.clinics for select to authenticated
  using (public.app_can(id, 'read') or public.is_platform_admin());
create policy clinics_update on public.clinics for update to authenticated
  using (public.app_can(id, 'admin') or public.is_platform_admin())
  with check (public.app_can(id, 'admin') or public.is_platform_admin());

-- profiles: cada uno ve el suyo y el de sus compañeros de clínica.
create policy profiles_select on public.profiles for select to authenticated
  using (
    id = auth.uid()
    or exists (
      select 1 from public.memberships a
      join public.memberships b on b.clinic_id = a.clinic_id
      where a.user_id = auth.uid() and b.user_id = profiles.id
    )
  );
create policy profiles_update_own on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- platform_admins: nadie lo modifica por la API; cada uno ve si es super-admin.
create policy platform_admins_self on public.platform_admins for select to authenticated
  using (user_id = auth.uid());

-- memberships: miembros ven la lista de su clínica; solo admin asigna roles.
create policy memberships_select on public.memberships for select to authenticated
  using (public.app_can(clinic_id, 'read') or user_id = auth.uid());
create policy memberships_write on public.memberships for all to authenticated
  using (public.app_can(clinic_id, 'admin'))
  with check (public.app_can(clinic_id, 'admin'));

-- audit_log: solo admin de la clínica lee. No hay políticas de escritura: la escriben los triggers.
create policy audit_select on public.audit_log for select to authenticated
  using (public.app_can(clinic_id, 'admin'));

-- Tablas con clinic_id: lectura para miembros; escritura según área.
create or replace function public.apply_clinic_policies(
  p_table text, p_write text, p_delete text default null
) returns void
language plpgsql
set search_path = ''
as $$
declare
  v_del text := coalesce(p_delete, p_write);
begin
  execute format('alter table public.%I enable row level security', p_table);

  execute format('create policy %I on public.%I for select to authenticated using (public.app_can(clinic_id, ''read''))',
    p_table || '_select', p_table);

  execute format('create policy %I on public.%I for insert to authenticated with check (public.app_can(clinic_id, %L))',
    p_table || '_insert', p_table, p_write);

  execute format('create policy %I on public.%I for update to authenticated using (public.app_can(clinic_id, %L)) with check (public.app_can(clinic_id, %L))',
    p_table || '_update', p_table, p_write, p_write);

  execute format('create policy %I on public.%I for delete to authenticated using (public.app_can(clinic_id, %L))',
    p_table || '_delete', p_table, v_del);
end;
$$;

do $$
begin
  perform public.apply_clinic_policies('branches',            'admin');
  perform public.apply_clinic_policies('professionals',       'admin');
  perform public.apply_clinic_policies('expenses',            'admin');
  perform public.apply_clinic_policies('liquidations',        'admin');
  perform public.apply_clinic_policies('agreements',          'admin');

  perform public.apply_clinic_policies('patients',            'operations', 'admin');
  perform public.apply_clinic_policies('appointments',        'operations');
  perform public.apply_clinic_policies('inventory_items',     'operations');
  perform public.apply_clinic_policies('lab_orders',          'operations');
  perform public.apply_clinic_policies('email_log',           'operations', 'admin');
  perform public.apply_clinic_policies('intake_links',        'operations');

  perform public.apply_clinic_policies('clinical_histories',  'clinical');
  perform public.apply_clinic_policies('odontogram_teeth',    'clinical');
  perform public.apply_clinic_policies('perio_teeth',         'clinical');
  perform public.apply_clinic_policies('treatments_done',     'clinical');
  perform public.apply_clinic_policies('consents',            'clinical', 'admin');
  perform public.apply_clinic_policies('budgets',             'clinical');
  perform public.apply_clinic_policies('budget_items',        'clinical');
  perform public.apply_clinic_policies('imaging_studies',     'clinical');
  perform public.apply_clinic_policies('report_templates',    'clinical');
  perform public.apply_clinic_policies('reports',             'clinical');
  perform public.apply_clinic_policies('report_images',       'clinical');
end $$;

-- Los ítems de presupuesto y las imágenes siguen al padre: si se edita el presupuesto, se editan sus líneas.

-- intake_submissions: el paciente escribe por RPC (ver migración 004); el personal lee y marca revisión.
alter table public.intake_submissions enable row level security;
create policy intake_submissions_select on public.intake_submissions for select to authenticated
  using (public.app_can(clinic_id, 'operations'));
create policy intake_submissions_review on public.intake_submissions for update to authenticated
  using (public.app_can(clinic_id, 'operations'))
  with check (public.app_can(clinic_id, 'operations'));
create policy intake_submissions_delete on public.intake_submissions for delete to authenticated
  using (public.app_can(clinic_id, 'admin'));

-- treatment_catalog: filas globales (clinic_id NULL) las lee cualquiera autenticado y solo el proveedor escribe;
-- las propias de la clínica las gestiona el admin.
alter table public.treatment_catalog enable row level security;
create policy catalog_select on public.treatment_catalog for select to authenticated
  using (clinic_id is null or public.app_can(clinic_id, 'read'));
create policy catalog_write_clinic on public.treatment_catalog for all to authenticated
  using (clinic_id is not null and public.app_can(clinic_id, 'admin'))
  with check (clinic_id is not null and public.app_can(clinic_id, 'admin'));
create policy catalog_write_global on public.treatment_catalog for all to authenticated
  using (clinic_id is null and public.is_platform_admin())
  with check (clinic_id is null and public.is_platform_admin());

drop function public.apply_clinic_policies(text, text, text);

-- ── Privilegios base ────────────────────────────────────────────────────────
-- Los privilegios son amplios porque RLS filtra cada fila. anon no tiene acceso directo a ninguna tabla.

revoke all on all tables in schema public from anon;
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;
revoke all on public.audit_log from authenticated;
grant select on public.audit_log to authenticated;

grant execute on function public.create_clinic(text) to authenticated;
grant execute on function public.invite_member(uuid, text, text) to authenticated;
grant execute on function public.app_can(uuid, text) to authenticated;
grant execute on function public.is_platform_admin() to authenticated;
grant execute on function public.member_role(uuid) to authenticated;
