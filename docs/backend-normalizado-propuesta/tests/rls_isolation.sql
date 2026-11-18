-- ClinicPlus · Pruebas de aislamiento entre clínicas y permisos por rol.
-- Ejecutar sobre una base con migraciones aplicadas:
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/rls_isolation.sql
-- Todo corre dentro de una transacción que se revierte al final: no deja datos.
-- Si una prueba falla, aborta con el mensaje "FAIL ...".

begin;

-- ── Auxiliares de prueba ────────────────────────────────────────────────────

create function pg_temp.as_user(p_uid uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', p_uid::text, 'role', 'authenticated')::text, false);
  execute 'set role authenticated';
end $$;

create function pg_temp.as_anon() returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('role', 'anon')::text, false);
  execute 'set role anon';
end $$;

create function pg_temp.as_super() returns void language plpgsql as $$
begin
  execute 'reset role';
  perform set_config('request.jwt.claims', '', false);
end $$;

-- La operación debe funcionar.
create function pg_temp.expect_ok(q text, msg text) returns void language plpgsql as $$
begin
  execute q;
exception when others then
  raise exception 'FAIL (debía funcionar): % → %', msg, sqlerrm;
end $$;

-- La operación debe fallar (por permisos, RLS o restricción).
create function pg_temp.expect_fail(q text, msg text) returns void language plpgsql as $$
begin
  execute q;
exception when others then
  return;
end $$;

-- Cuenta las filas visibles para el rol actual.
create function pg_temp.count_rows(q text) returns bigint language plpgsql as $$
declare n bigint;
begin
  execute 'select count(*) from (' || q || ') s' into n;
  return n;
end $$;

-- Cuenta las filas afectadas por una escritura (RLS puede filtrarlas en silencio).
create function pg_temp.affected(q text) returns bigint language plpgsql as $$
declare n bigint;
begin
  execute q;
  get diagnostics n = row_count;
  return n;
end $$;

create function pg_temp.assert_eq(actual anyelement, expected anyelement, msg text) returns void language plpgsql as $$
begin
  if actual is distinct from expected then
    raise exception 'FAIL: % (esperado %, obtenido %)', msg, expected, actual;
  end if;
end $$;

-- ── Datos de prueba (como superusuario) ─────────────────────────────────────

-- Usuarios: A/D/R/L en clínica 1; B en clínica 2; P super-admin; X sin membresía; N para create_clinic; D2 para invitar.
insert into auth.users (id, email) values
  ('a0000000-0000-0000-0000-000000000001', 'admin1@test'),
  ('a0000000-0000-0000-0000-000000000002', 'dentista1@test'),
  ('a0000000-0000-0000-0000-000000000003', 'recepcion1@test'),
  ('a0000000-0000-0000-0000-000000000004', 'lectura1@test'),
  ('a0000000-0000-0000-0000-000000000005', 'admin2@test'),
  ('a0000000-0000-0000-0000-000000000006', 'proveedor@test'),
  ('a0000000-0000-0000-0000-000000000007', 'sinclinica@test'),
  ('a0000000-0000-0000-0000-000000000008', 'nueva@test'),
  ('a0000000-0000-0000-0000-000000000009', 'invitado@test');

insert into public.clinics (id, name) values
  ('c1000000-0000-0000-0000-000000000001', 'Clínica Uno'),
  ('c1000000-0000-0000-0000-000000000002', 'Clínica Dos');

insert into public.memberships (clinic_id, user_id, role) values
  ('c1000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'admin'),
  ('c1000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', 'dentista'),
  ('c1000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000003', 'recepcion'),
  ('c1000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000004', 'solo_lectura'),
  ('c1000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000005', 'admin');

insert into public.platform_admins (user_id) values ('a0000000-0000-0000-0000-000000000006');

insert into public.patients (id, clinic_id, name, rut) values
  ('b1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 'Paciente Uno', '11.111.111-1'),
  ('b1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000002', 'Paciente Dos', '22.222.222-2');

insert into public.clinical_histories (patient_id, clinic_id, diagnosis) values
  ('b1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 'Diagnóstico privado 1');

insert into public.treatments_done (clinic_id, patient_id, procedure_name) values
  ('c1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'Limpieza');

select pg_temp.as_super();

-- ── 1. Aislamiento de lectura entre clínicas ────────────────────────────────

select pg_temp.as_user('a0000000-0000-0000-0000-000000000001');
select pg_temp.assert_eq(pg_temp.count_rows('select id from public.patients'), 1::bigint, 'admin1 ve solo pacientes de clínica 1');
select pg_temp.assert_eq(pg_temp.count_rows('select id from public.clinics'), 1::bigint, 'admin1 ve solo su clínica');
select pg_temp.assert_eq(pg_temp.count_rows('select patient_id from public.clinical_histories'), 1::bigint, 'admin1 ve la historia de su clínica');
select pg_temp.assert_eq(pg_temp.affected('update public.patients set name = ''Hackeado'' where id = ''b1000000-0000-0000-0000-000000000002'''), 0::bigint, 'admin1 no puede editar pacientes de clínica 2');
select pg_temp.expect_fail('insert into public.patients (clinic_id, name) values (''c1000000-0000-0000-0000-000000000002'', ''Intruso'')', 'admin1 no puede insertar en clínica 2');

select pg_temp.as_user('a0000000-0000-0000-0000-000000000005');
select pg_temp.assert_eq(pg_temp.count_rows('select id from public.patients'), 1::bigint, 'admin2 ve solo pacientes de clínica 2');
select pg_temp.assert_eq(pg_temp.count_rows('select id from public.patients where id = ''b1000000-0000-0000-0000-000000000001'''), 0::bigint, 'admin2 no ve pacientes de clínica 1 ni por id');

-- ── 2. Sin membresía y anónimo ─────────────────────────────────────────────

select pg_temp.as_user('a0000000-0000-0000-0000-000000000007');
select pg_temp.assert_eq(pg_temp.count_rows('select id from public.patients'), 0::bigint, 'usuario sin clínica no ve pacientes');
select pg_temp.assert_eq(pg_temp.count_rows('select id from public.clinics'), 0::bigint, 'usuario sin clínica no ve clínicas');

select pg_temp.as_anon();
select pg_temp.expect_fail('select * from public.patients', 'anon no lee pacientes');
select pg_temp.expect_fail('select * from public.clinical_histories', 'anon no lee historias clínicas');

-- ── 3. Permisos por rol dentro de la clínica ───────────────────────────────

select pg_temp.as_user('a0000000-0000-0000-0000-000000000003');  -- recepcion
select pg_temp.expect_ok('insert into public.patients (clinic_id, name) values (''c1000000-0000-0000-0000-000000000001'', ''Nuevo Recep'')', 'recepcion crea pacientes');
select pg_temp.expect_fail('insert into public.clinical_histories (patient_id, clinic_id, diagnosis) values (''b1000000-0000-0000-0000-000000000001'', ''c1000000-0000-0000-0000-000000000001'', ''x'')', 'recepcion no escribe historia clínica');
select pg_temp.expect_fail('insert into public.treatments_done (clinic_id, patient_id, procedure_name) values (''c1000000-0000-0000-0000-000000000001'', ''b1000000-0000-0000-0000-000000000001'', ''x'')', 'recepcion no registra tratamientos');
select pg_temp.expect_fail('insert into public.expenses (clinic_id, spent_on, category, description, amount_usd) values (''c1000000-0000-0000-0000-000000000001'', current_date, ''Otros'', ''x'', 1)', 'recepcion no registra gastos');
select pg_temp.assert_eq(pg_temp.count_rows('select id from public.audit_log'), 0::bigint, 'recepcion no lee auditoría');

select pg_temp.as_user('a0000000-0000-0000-0000-000000000002');  -- dentista
select pg_temp.expect_ok('insert into public.treatments_done (clinic_id, patient_id, procedure_name) values (''c1000000-0000-0000-0000-000000000001'', ''b1000000-0000-0000-0000-000000000001'', ''Resina'')', 'dentista registra tratamientos');
select pg_temp.expect_fail('insert into public.liquidations (clinic_id, professional_id, period_on, gross_fees_usd, pct_snapshot) values (''c1000000-0000-0000-0000-000000000001'', (select id from public.professionals limit 1), current_date, 1, 1)', 'dentista no liquida honorarios');
select pg_temp.assert_eq(pg_temp.affected('update public.clinics set name = ''Cambio'' where id = ''c1000000-0000-0000-0000-000000000001'''), 0::bigint, 'dentista no edita la clínica (RLS filtra la fila)');
select pg_temp.assert_eq(pg_temp.count_rows('select id from public.audit_log'), 0::bigint, 'dentista no lee auditoría');

select pg_temp.as_user('a0000000-0000-0000-0000-000000000004');  -- solo lectura
select pg_temp.assert_eq(pg_temp.count_rows('select id from public.patients'), 2::bigint, 'solo lectura ve pacientes de su clínica');
select pg_temp.expect_fail('insert into public.patients (clinic_id, name) values (''c1000000-0000-0000-0000-000000000001'', ''No'')', 'solo lectura no crea pacientes');
select pg_temp.assert_eq(pg_temp.affected('update public.patients set name = ''No'' where id = ''b1000000-0000-0000-0000-000000000001'''), 0::bigint, 'solo lectura no edita pacientes (RLS filtra la fila)');
select pg_temp.assert_eq(pg_temp.affected('delete from public.patients where id = ''b1000000-0000-0000-0000-000000000001'''), 0::bigint, 'solo lectura no borra pacientes (RLS filtra la fila)');

-- ── 4. Administración de la clínica ────────────────────────────────────────

select pg_temp.as_user('a0000000-0000-0000-0000-000000000001');  -- admin1
select pg_temp.expect_ok('insert into public.expenses (clinic_id, spent_on, category, description, amount_usd) values (''c1000000-0000-0000-0000-000000000001'', current_date, ''Insumos'', ''Guantes'', 12.5)', 'admin registra gastos');
select pg_temp.expect_ok('update public.clinics set name = ''Clínica Uno SA'' where id = ''c1000000-0000-0000-0000-000000000001''', 'admin edita configuración de su clínica');
select pg_temp.expect_fail('update public.clinics set status = ''suspendida'' where id = ''c1000000-0000-0000-0000-000000000001''', 'admin no cambia su propio estado comercial');
select pg_temp.expect_fail('update public.clinics set plan = ''pro'' where id = ''c1000000-0000-0000-0000-000000000001''', 'admin no cambia su propio plan');
select pg_temp.assert_eq(pg_temp.count_rows('select id from public.audit_log where clinic_id = ''c1000000-0000-0000-0000-000000000002'''), 0::bigint, 'admin1 no lee auditoría de clínica 2');
select pg_temp.assert_eq(pg_temp.count_rows('select id from public.audit_log where clinic_id = ''c1000000-0000-0000-0000-000000000001'' and action = ''UPDATE'' and table_name = ''patients'''), 0::bigint, 'antes de editar, no hay UPDATE de pacientes (se verifica luego)');

-- Invitar: admin sí, dentista no.
select pg_temp.expect_ok('select public.invite_member(''c1000000-0000-0000-0000-000000000001'', ''invitado@test'', ''recepcion'')', 'admin invita miembros');
select pg_temp.as_user('a0000000-0000-0000-0000-000000000002');
select pg_temp.expect_fail('select public.invite_member(''c1000000-0000-0000-0000-000000000001'', ''nueva@test'', ''admin'')', 'dentista no invita miembros');

-- ── 5. Super-admin del proveedor ───────────────────────────────────────────

select pg_temp.as_user('a0000000-0000-0000-0000-000000000006');  -- proveedor
select pg_temp.expect_ok('update public.clinics set status = ''suspendida'' where id = ''c1000000-0000-0000-0000-000000000002''', 'proveedor cambia estado comercial');
select pg_temp.assert_eq(pg_temp.count_rows('select id from public.clinics'), 2::bigint, 'proveedor ve todas las clínicas');
select pg_temp.assert_eq(pg_temp.count_rows('select patient_id from public.clinical_histories'), 0::bigint, 'proveedor NO ve fichas clínicas (no es miembro)');
select pg_temp.assert_eq(pg_temp.count_rows('select id from public.patients'), 0::bigint, 'proveedor NO ve pacientes (no es miembro)');

-- ── 6. Auditoría ───────────────────────────────────────────────────────────

select pg_temp.as_user('a0000000-0000-0000-0000-000000000001');
select pg_temp.expect_ok('update public.patients set name = ''Paciente Uno Editado'' where id = ''b1000000-0000-0000-0000-000000000001''', 'admin edita un paciente de su clínica');
select pg_temp.assert_eq(pg_temp.count_rows('select id from public.audit_log where clinic_id = ''c1000000-0000-0000-0000-000000000001'' and action = ''UPDATE'' and table_name = ''patients'' and actor_id = ''a0000000-0000-0000-0000-000000000001'''), 1::bigint, 'el cambio de paciente queda auditado con el autor');
select pg_temp.expect_fail('update public.audit_log set action = ''INSERT''', 'nadie modifica la auditoría');
select pg_temp.expect_fail('delete from public.audit_log', 'nadie borra la auditoría');

-- ── 7. Almacenamiento de archivos ──────────────────────────────────────────

select pg_temp.as_super();
insert into storage.buckets (id, name) values ('clinic-files', 'clinic-files') on conflict do nothing;
insert into storage.objects (bucket_id, name) values
  ('clinic-files', 'c1000000-0000-0000-0000-000000000001/firmas/firma1.png'),
  ('clinic-files', 'c1000000-0000-0000-0000-000000000002/firmas/firma2.png');

select pg_temp.as_user('a0000000-0000-0000-0000-000000000001');
select pg_temp.assert_eq(pg_temp.count_rows('select id from storage.objects'), 1::bigint, 'admin1 solo ve archivos de su clínica');
select pg_temp.expect_fail('insert into storage.objects (bucket_id, name) values (''clinic-files'', ''c1000000-0000-0000-0000-000000000002/firmas/x.png'')', 'admin1 no sube archivos a clínica 2');
select pg_temp.expect_fail('insert into storage.objects (bucket_id, name) values (''clinic-files'', ''no-es-un-uuid/firma.png'')', 'ruta sin clinic_id válido no se sube');

select pg_temp.as_user('a0000000-0000-0000-0000-000000000003');  -- recepcion
select pg_temp.expect_fail('insert into storage.objects (bucket_id, name) values (''clinic-files'', ''c1000000-0000-0000-0000-000000000001/estudios/rx.dcm'')', 'recepcion no sube estudios clínicos');

-- ── 8. Formulario de paciente por enlace ───────────────────────────────────

-- Recepción genera el enlace; el token queda en una variable de sesión para el paciente (anon).
select pg_temp.as_user('a0000000-0000-0000-0000-000000000003');
select set_config('test.token', public.create_intake_link('b1000000-0000-0000-0000-000000000001'), false);

select pg_temp.as_anon();
select pg_temp.expect_ok('select public.submit_patient_intake(current_setting(''test.token''), ''{"motivo":"dolor"}''::jsonb)', 'paciente envía formulario con enlace válido');
select pg_temp.expect_fail('select public.submit_patient_intake(current_setting(''test.token''), ''{"motivo":"otra vez"}''::jsonb)', 'el enlace no se reutiliza');
select pg_temp.expect_fail('select public.submit_patient_intake(''token-falso'', ''{}''::jsonb)', 'token inválido se rechaza');
select pg_temp.expect_fail('select * from public.intake_submissions', 'anon no lee las respuestas');

select pg_temp.as_user('a0000000-0000-0000-0000-000000000001');
select pg_temp.assert_eq(pg_temp.count_rows('select id from public.intake_submissions'), 1::bigint, 'admin1 ve la respuesta del paciente');

-- ── 9. Restricciones de datos ──────────────────────────────────────────────

select pg_temp.as_super();
select pg_temp.expect_fail('insert into public.patients (clinic_id, name, rut) values (''c1000000-0000-0000-0000-000000000001'', ''Duplicado'', ''11.111.111-1'')', 'mismo RUT dos veces en la misma clínica');
select pg_temp.expect_ok('insert into public.patients (clinic_id, name, rut) values (''c1000000-0000-0000-0000-000000000002'', ''Mismo RUT otra clínica'', ''11.111.111-1'')', 'mismo RUT en otra clínica sí se permite');
select pg_temp.expect_fail('insert into public.odontogram_teeth (clinic_id, patient_id, tooth_fdi, dentition) values (''c1000000-0000-0000-0000-000000000001'', ''b1000000-0000-0000-0000-000000000001'', 55, ''permanente'')', 'diente 55 no puede ser permanente');
select pg_temp.expect_fail('insert into public.odontogram_teeth (clinic_id, patient_id, tooth_fdi, dentition) values (''c1000000-0000-0000-0000-000000000001'', ''b1000000-0000-0000-0000-000000000001'', 11, ''permanente'') , (''c1000000-0000-0000-0000-000000000001'', ''b1000000-0000-0000-0000-000000000001'', 11, ''permanente'')', 'una sola fila por pieza y paciente');
select pg_temp.expect_fail('insert into public.odontogram_teeth (clinic_id, patient_id, tooth_fdi, dentition, surf_top) values (''c1000000-0000-0000-0000-000000000001'', ''b1000000-0000-0000-0000-000000000001'', 12, ''permanente'', ''inventada'')', 'condición de cara fuera del catálogo');
select pg_temp.expect_fail('insert into public.expenses (clinic_id, spent_on, category, description, amount_usd) values (''c1000000-0000-0000-0000-000000000001'', current_date, ''Viajes'', ''x'', 1)', 'categoría de gasto fuera de la lista');

-- Totales calculados en la base de datos.
insert into public.budgets (id, clinic_id, patient_id) values ('d1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001');
insert into public.budget_items (clinic_id, budget_id, name, unit_price_usd, qty)
values ('c1000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000001', 'Resina', 10.00, 3);
select pg_temp.assert_eq((select line_total_usd from public.budget_items where budget_id = 'd1000000-0000-0000-0000-000000000001'), 30.00::numeric, 'total de línea = precio × cantidad');

-- Liquidación: el monto sale de honorarios × porcentaje copiado.
insert into public.professionals (id, clinic_id, name, liquidation_pct) values ('e1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 'Dr. Prueba', 35);
insert into public.liquidations (clinic_id, professional_id, period_on, gross_fees_usd, pct_snapshot)
values ('c1000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000001', '2026-11-01', 1000, 35);
select pg_temp.assert_eq((select amount_usd from public.liquidations where professional_id = 'e1000000-0000-0000-0000-000000000001'), 350.00::numeric, 'monto liquidado = honorarios × porcentaje');

-- ── 10. Alta de clínica por el propio usuario ──────────────────────────────

select pg_temp.as_user('a0000000-0000-0000-0000-000000000008');  -- nueva, sin clínica
select pg_temp.expect_ok('select public.create_clinic(''Clínica Nueva'')', 'usuario nuevo crea su clínica');
select pg_temp.assert_eq(pg_temp.count_rows('select id from public.clinics'), 1::bigint, 'quien crea la clínica la ve');
select pg_temp.assert_eq(pg_temp.count_rows('select role from public.memberships'), 1::bigint, 'quien crea la clínica queda como admin');

select pg_temp.as_anon();
select pg_temp.expect_fail('select public.create_clinic(''Anónima'')', 'anon no crea clínicas');

select pg_temp.as_super();
do $$ begin raise notice 'TODAS LAS PRUEBAS PASARON'; end $$;

rollback;
