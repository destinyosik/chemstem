create table public.chemist_applications (
  user_id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null check (char_length(btrim(full_name)) between 1 and 120),
  email text not null,
  university text not null check (char_length(btrim(university)) between 1 and 200),
  motivation text not null check (char_length(motivation) <= 500),
  access_status text not null default 'active'
    check (access_status in ('active', 'suspended')),
  created_at timestamptz not null default now()
);

alter table public.chemist_applications enable row level security;

revoke all on table public.chemist_applications from public, anon, authenticated;
grant select on table public.chemist_applications to authenticated;

create policy "Administrators can view chemist applications"
  on public.chemist_applications
  for select
  to authenticated
  using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create function public.handle_new_chemist_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  application_name text := nullif(btrim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), '');
  application_university text := nullif(btrim(coalesce(new.raw_user_meta_data ->> 'university', '')), '');
  application_motivation text := btrim(coalesce(new.raw_user_meta_data ->> 'motivation', ''));
begin
  if new.email is null then
    raise exception 'An email address is required to register a chemist application';
  end if;

  if application_name is null or char_length(application_name) > 120 then
    raise exception 'A valid full name is required';
  end if;

  if application_university is null or char_length(application_university) > 200 then
    raise exception 'A valid university is required';
  end if;

  if char_length(application_motivation) not between 1 and 500 then
    raise exception 'A response of 1 to 500 characters is required';
  end if;

  insert into public.chemist_applications (
    user_id,
    full_name,
    email,
    university,
    motivation
  )
  values (
    new.id,
    application_name,
    new.email,
    application_university,
    application_motivation
  );

  return new;
end;
$$;

revoke all on function public.handle_new_chemist_user() from public, anon, authenticated;

create trigger on_chemist_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_chemist_user();

create function public.sync_chemist_application_email()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.email is not null and new.email is distinct from old.email then
    update public.chemist_applications
    set email = new.email
    where user_id = new.id;
  end if;

  return new;
end;
$$;

revoke all on function public.sync_chemist_application_email() from public, anon, authenticated;

create trigger on_chemist_auth_email_updated
  after update of email on auth.users
  for each row execute procedure public.sync_chemist_application_email();

insert into public.chemist_applications (
  user_id,
  full_name,
  email,
  university,
  motivation,
  created_at
)
select
  users.id,
  left(coalesce(nullif(btrim(users.raw_user_meta_data ->> 'full_name'), ''), users.email), 120),
  users.email,
  coalesce(nullif(btrim(users.raw_user_meta_data ->> 'university'), ''), 'Not provided'),
  left(coalesce(users.raw_user_meta_data ->> 'motivation', ''), 500),
  users.created_at
from auth.users as users
where users.email is not null
on conflict (user_id) do nothing;

create function public.current_user_access_status()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select application.access_status
  from public.chemist_applications as application
  where application.user_id = (select auth.uid());
$$;

revoke all on function public.current_user_access_status() from public, anon;
grant execute on function public.current_user_access_status() to authenticated;

create function public.admin_search_chemist_applications(
  p_search text default null,
  p_access_status text default null,
  p_registered_after date default null,
  p_registered_before date default null,
  p_limit integer default 51,
  p_offset integer default 0
)
returns table (
  user_id uuid,
  full_name text,
  email text,
  university text,
  motivation text,
  access_status text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') <> 'admin' then
    raise exception 'Administrator access required' using errcode = '42501';
  end if;

  if p_access_status is not null and p_access_status not in ('active', 'suspended') then
    raise exception 'Invalid access status';
  end if;

  if p_registered_after is not null
    and p_registered_before is not null
    and p_registered_after > p_registered_before then
    raise exception 'Registration date range is invalid';
  end if;

  return query
  select
    application.user_id,
    application.full_name,
    application.email,
    application.university,
    application.motivation,
    application.access_status,
    application.created_at
  from public.chemist_applications as application
  where (
    p_search is null
    or btrim(p_search) = ''
    or application.full_name ilike '%' || p_search || '%'
    or application.email ilike '%' || p_search || '%'
    or application.university ilike '%' || p_search || '%'
    or application.motivation ilike '%' || p_search || '%'
  )
    and (p_access_status is null or application.access_status = p_access_status)
    and (
      p_registered_after is null
      or application.created_at >= p_registered_after::timestamp at time zone 'UTC'
    )
    and (
      p_registered_before is null
      or application.created_at < (p_registered_before + 1)::timestamp at time zone 'UTC'
    )
  order by application.created_at desc, application.user_id
  limit least(greatest(coalesce(p_limit, 51), 1), 51)
  offset greatest(coalesce(p_offset, 0), 0);
end;
$$;

revoke all on function public.admin_search_chemist_applications(text, text, date, date, integer, integer)
  from public, anon;
grant execute on function public.admin_search_chemist_applications(text, text, date, date, integer, integer)
  to authenticated;

create function public.admin_set_chemist_access(
  p_user_id uuid,
  p_access_status text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') <> 'admin' then
    raise exception 'Administrator access required' using errcode = '42501';
  end if;

  if p_user_id = (select auth.uid()) then
    raise exception 'Administrators cannot suspend their own account';
  end if;

  if p_access_status not in ('active', 'suspended') then
    raise exception 'Invalid access status';
  end if;

  if exists (
    select 1
    from auth.users as target
    where target.id = p_user_id
      and target.raw_app_meta_data ->> 'role' = 'admin'
  ) then
    raise exception 'Administrator accounts cannot be suspended here';
  end if;

  update public.chemist_applications
  set access_status = p_access_status
  where user_id = p_user_id;

  if not found then
    raise exception 'Chemist application not found';
  end if;
end;
$$;

revoke all on function public.admin_set_chemist_access(uuid, text) from public, anon;
grant execute on function public.admin_set_chemist_access(uuid, text) to authenticated;
