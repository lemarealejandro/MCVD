-- Solicitudes de registro de clínicas nuevas.
-- Un usuario se registra (función clinic-signup) y queda pendiente hasta que el
-- administrador aprueba la solicitud desde el enlace que recibe por correo
-- (función clinic-approval). Al aprobar se crea la clínica y su membresía.

create table public.clinic_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  clinic_name text not null check (length(clinic_name) between 2 and 200),
  contact_name text not null check (length(contact_name) between 2 and 200),
  phone text check (length(phone) <= 40),
  email text not null check (length(email) <= 320),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  token_hash text not null,               -- sha256 del código del enlace de aprobación
  token_expires_at timestamptz not null default now() + interval '30 days',
  clinic_id uuid references public.clinics (id) on delete set null,
  notified_at timestamptz,                -- cuándo se envió el correo al administrador
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);
create index clinic_requests_status_idx on public.clinic_requests (status, created_at desc);
create index clinic_requests_clinic_id_idx on public.clinic_requests (clinic_id);

alter table public.clinic_requests enable row level security;

-- El solicitante solo puede ver el estado de su propia solicitud (sin el token).
revoke all on public.clinic_requests from anon, authenticated;
grant select (id, user_id, clinic_name, contact_name, phone, email, status, created_at, reviewed_at)
  on public.clinic_requests to authenticated;

create policy "Usuarios ven su solicitud" on public.clinic_requests
  for select to authenticated using (user_id = (select auth.uid()));

-- Aprobación atómica: crea la clínica, asigna al usuario como owner y cierra la solicitud.
-- Solo la usa la función clinic-approval (service_role).
create function public.approve_clinic_request(req_id uuid) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  req public.clinic_requests;
  new_clinic uuid;
begin
  select * into req from public.clinic_requests where id = req_id for update;
  if not found then raise exception 'Solicitud no encontrada'; end if;
  if req.status <> 'pending' then raise exception 'La solicitud ya fue %', req.status; end if;

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
