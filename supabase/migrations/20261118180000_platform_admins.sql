-- Administradores de la plataforma: ven y revisan las solicitudes de clínicas y la
-- lista de clínicas con sus usuarios. NO tienen acceso a los datos clínicos
-- (clinic_data, patient_form_submissions) de las clínicas.

create table public.platform_admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.platform_admins enable row level security;
revoke all on public.platform_admins from anon, authenticated;
grant select on public.platform_admins to authenticated;

-- Cada usuario solo puede comprobar si él mismo es administrador.
create policy "Usuarios ven si son administradores" on public.platform_admins
  for select to authenticated using (user_id = (select auth.uid()));

create function private.is_platform_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.platform_admins where user_id = (select auth.uid()));
$$;
revoke all on function private.is_platform_admin() from public, anon;
grant execute on function private.is_platform_admin() to authenticated;

-- Resumen para el panel: solicitudes y clínicas con sus usuarios.
create function public.admin_overview() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  if not private.is_platform_admin() then
    raise exception 'No autorizado' using errcode = '42501';
  end if;

  return jsonb_build_object(
    'requests', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', r.id,
        'clinicName', r.clinic_name,
        'contactName', r.contact_name,
        'phone', r.phone,
        'email', r.email,
        'status', r.status,
        'notified', r.notified_at is not null,
        'createdAt', r.created_at,
        'reviewedAt', r.reviewed_at
      ) order by r.created_at desc)
      from public.clinic_requests r), '[]'::jsonb),
    'clinics', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', c.id,
        'name', c.name,
        'demo', c.demo_data,
        'createdAt', c.created_at,
        'lastActivity', (select max(d.updated_at) from public.clinic_data d where d.clinic_id = c.id),
        'members', coalesce((
          select jsonb_agg(jsonb_build_object(
            'email', u.email,
            'role', m.role,
            'lastSignIn', u.last_sign_in_at
          ) order by m.created_at)
          from public.clinic_members m
          join auth.users u on u.id = m.user_id
          where m.clinic_id = c.id), '[]'::jsonb)
      ) order by c.created_at desc)
      from public.clinics c), '[]'::jsonb)
  );
end;
$$;
revoke all on function public.admin_overview() from public, anon;
grant execute on function public.admin_overview() to authenticated;

-- Aprobar o rechazar una solicitud desde el panel.
create function public.admin_review_clinic_request(req_id uuid, decision text) returns text
language plpgsql security definer set search_path = '' as $$
begin
  if not private.is_platform_admin() then
    raise exception 'No autorizado' using errcode = '42501';
  end if;

  if decision = 'approve' then
    perform public.approve_clinic_request(req_id);
    return 'approved';
  elsif decision = 'reject' then
    update public.clinic_requests
      set status = 'rejected', reviewed_at = now()
      where id = req_id and status = 'pending';
    if not found then
      raise exception 'La solicitud ya fue revisada';
    end if;
    return 'rejected';
  end if;

  raise exception 'Acción no válida';
end;
$$;
revoke all on function public.admin_review_clinic_request(uuid, text) from public, anon;
grant execute on function public.admin_review_clinic_request(uuid, text) to authenticated;
