-- Mensaje de error en español al intentar aprobar una solicitud ya revisada.
create or replace function public.approve_clinic_request(req_id uuid) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  req public.clinic_requests;
  new_clinic uuid;
begin
  select * into req from public.clinic_requests where id = req_id for update;
  if not found then raise exception 'Solicitud no encontrada'; end if;
  if req.status <> 'pending' then
    raise exception 'La solicitud ya fue %', case req.status when 'approved' then 'aprobada' else 'rechazada' end;
  end if;

  insert into public.clinics (name, demo_data) values (req.clinic_name, false) returning id into new_clinic;
  insert into public.clinic_members (clinic_id, user_id, role) values (new_clinic, req.user_id, 'owner');
  update public.clinic_requests
    set status = 'approved', clinic_id = new_clinic, reviewed_at = now()
    where id = req_id;
  return new_clinic;
end;
$$;

revoke all on function public.approve_clinic_request(uuid) from public, anon, authenticated;
grant execute on function public.approve_clinic_request(uuid) to service_role;
