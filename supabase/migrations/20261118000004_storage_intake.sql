-- ClinicPlus · Almacenamiento de archivos y formulario de paciente.

-- ── Storage ─────────────────────────────────────────────────────────────────
-- Bucket privado. Convención de rutas: {clinic_id}/{area}/{nombre}
--   {clinic_id}/firmas/...        firmas de consentimiento y presupuesto
--   {clinic_id}/estudios/...      radiografías, CBCT, panorámicas
--   {clinic_id}/informes/...      imágenes de informes
-- Se lee con URLs firmadas de vida corta; nunca con URL pública.

insert into storage.buckets (id, name, public)
values ('clinic-files', 'clinic-files', false)
on conflict (id) do nothing;

-- Extrae el clinic_id de la primera carpeta de la ruta. Si no es un UUID, devuelve null (sin acceso).
create or replace function public.storage_clinic_id(p_name text)
returns uuid
language plpgsql
immutable
set search_path = ''
as $$
begin
  return split_part(p_name, '/', 1)::uuid;
exception
  when invalid_text_representation then
    return null;
end;
$$;

drop policy if exists clinic_files_select on storage.objects;
drop policy if exists clinic_files_insert on storage.objects;
drop policy if exists clinic_files_update on storage.objects;
drop policy if exists clinic_files_delete on storage.objects;

create policy clinic_files_select on storage.objects for select to authenticated
  using (bucket_id = 'clinic-files' and public.app_can(public.storage_clinic_id(name), 'read'));

create policy clinic_files_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'clinic-files' and public.app_can(public.storage_clinic_id(name), 'clinical'));

create policy clinic_files_update on storage.objects for update to authenticated
  using (bucket_id = 'clinic-files' and public.app_can(public.storage_clinic_id(name), 'clinical'))
  with check (bucket_id = 'clinic-files' and public.app_can(public.storage_clinic_id(name), 'clinical'));

create policy clinic_files_delete on storage.objects for delete to authenticated
  using (bucket_id = 'clinic-files' and public.app_can(public.storage_clinic_id(name), 'admin'));

-- ── Formulario de paciente (público, por enlace) ────────────────────────────

-- El personal genera un enlace de un solo uso para un paciente. Devuelve el token en claro una sola vez.
create or replace function public.create_intake_link(p_patient uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_clinic uuid;
  v_token  text := replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');
begin
  select p.clinic_id into v_clinic
  from public.patients p
  where p.id = p_patient and p.deleted_at is null;

  if v_clinic is null then
    raise exception 'Paciente no encontrado';
  end if;
  if not public.app_can(v_clinic, 'operations') then
    raise exception 'Sin permiso para generar el enlace' using errcode = '42501';
  end if;

  insert into public.intake_links (clinic_id, patient_id, token_hash, created_by)
  values (v_clinic, p_patient, encode(sha256(convert_to(v_token, 'UTF8')), 'hex'), auth.uid());

  return v_token;
end;
$$;

-- El paciente envía el formulario con el token. No necesita cuenta.
-- Valida el enlace, limita el tamaño del payload y marca el enlace como usado.
create or replace function public.submit_patient_intake(p_token text, p_payload jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_link   public.intake_links%rowtype;
  v_id     uuid;
begin
  if p_token is null or length(p_token) <> 64 then
    raise exception 'Enlace no válido';
  end if;
  if p_payload is null or jsonb_typeof(p_payload) <> 'object' then
    raise exception 'Formulario no válido';
  end if;
  if octet_length(p_payload::text) > 50000 then
    raise exception 'Formulario demasiado grande';
  end if;

  select * into v_link
  from public.intake_links
  where token_hash = encode(sha256(convert_to(p_token, 'UTF8')), 'hex')
  for update;

  if not found or v_link.used_at is not null or v_link.expires_at <= now() then
    raise exception 'Enlace vencido o ya utilizado';
  end if;

  insert into public.intake_submissions (clinic_id, patient_id, link_id, payload)
  values (v_link.clinic_id, v_link.patient_id, v_link.id, p_payload)
  returning id into v_id;

  update public.intake_links set used_at = now() where id = v_link.id;

  return v_id;
end;
$$;

grant execute on function public.create_intake_link(uuid) to authenticated;
grant execute on function public.submit_patient_intake(text, jsonb) to anon, authenticated;
grant execute on function public.storage_clinic_id(text) to authenticated;
revoke execute on function public.create_clinic(text) from anon;
revoke execute on function public.invite_member(uuid, text, text) from anon;
