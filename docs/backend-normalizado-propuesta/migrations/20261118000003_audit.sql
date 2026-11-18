-- ClinicPlus · Auditoría de cambios en datos clínicos y de acceso.
-- Quién, cuándo y qué cambió. Solo el admin lee audit_log (migración 002); nadie lo escribe fuera de estos triggers.

create or replace function public.audit_row()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_old     jsonb := case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end;
  v_new     jsonb := case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end;
  v_src     jsonb := coalesce(v_new, v_old);
  -- Las filas de clinics no tienen clinic_id: su propio id es la clínica.
  v_clinic  uuid  := coalesce((v_src ->> 'clinic_id')::uuid, case when tg_table_name = 'clinics' then (v_src ->> 'id')::uuid end);
  v_row_id  text  := coalesce(v_src ->> 'id', v_src ->> 'patient_id', v_src ->> 'clinic_id');
begin
  insert into public.audit_log (clinic_id, table_name, row_id, action, actor_id, old_data, new_data)
  values (v_clinic, tg_table_name, v_row_id, tg_op, auth.uid(), v_old, v_new);
  return coalesce(new, old);
end;
$$;

do $$
declare t text;
begin
  foreach t in array array[
    'patients', 'clinical_histories', 'consents', 'odontogram_teeth', 'perio_teeth',
    'treatments_done', 'budgets', 'budget_items', 'reports', 'imaging_studies',
    'memberships', 'clinics', 'intake_submissions'
  ] loop
    execute format(
      'create trigger %I after insert or update or delete on public.%I for each row execute function public.audit_row()',
      'audit_' || t, t
    );
  end loop;
end $$;
