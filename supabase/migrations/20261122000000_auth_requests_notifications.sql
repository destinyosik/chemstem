alter table public.chemist_applications
  add column if not exists username text,
  add column if not exists request_status text not null default 'approved',
  add column if not exists reviewed_at timestamptz,
  add column if not exists reviewed_by uuid references auth.users (id),
  add column if not exists review_note text;

update public.chemist_applications
set username = lower(regexp_replace(split_part(coalesce(email, ''), '@', 1), '[^a-z0-9_]', '', 'gi'))
where username is null;

update public.chemist_applications
set username = 'chemist_' || substr(replace(user_id::text, '-', ''), 1, 12)
where username is null or btrim(username) = '';

with duplicate_usernames as (
  select user_id, username,
    row_number() over (partition by lower(username) order by created_at, user_id) as username_rank
  from public.chemist_applications
)
update public.chemist_applications as application
set username = left(lower(application.username), 18) || '_' || substr(replace(application.user_id::text, '-', ''), 1, 11)
from duplicate_usernames
where application.user_id = duplicate_usernames.user_id
  and duplicate_usernames.username_rank > 1;

alter table public.chemist_applications
  alter column username set not null,
  add constraint chemist_applications_username_format
    check (username ~ '^[a-z0-9_]{3,30}$'),
  add constraint chemist_applications_request_status
    check (request_status in ('pending', 'approved', 'rejected'));

create unique index if not exists chemist_applications_username_unique
  on public.chemist_applications (lower(username));

drop policy if exists "Users can read their own chemist application" on public.chemist_applications;
create policy "Users can read their own chemist application"
  on public.chemist_applications
  for select
  to authenticated
  using (user_id = (select auth.uid()));

create table if not exists public.user_roles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'member' check (role in ('member', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_roles enable row level security;
revoke all on table public.user_roles from public, anon, authenticated;

insert into public.user_roles (user_id, role)
select id, 'member'
from auth.users
on conflict (user_id) do nothing;

create table if not exists public.request_status_history (
  id uuid primary key default gen_random_uuid(),
  request_user_id uuid not null references auth.users (id) on delete cascade,
  old_status text,
  new_status text not null check (new_status in ('pending', 'approved', 'rejected')),
  changed_by uuid references auth.users (id),
  note text,
  created_at timestamptz not null default now()
);

alter table public.request_status_history enable row level security;
revoke all on table public.request_status_history from public, anon, authenticated;

create table if not exists public.request_notifications (
  id uuid primary key default gen_random_uuid(),
  request_user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('submitted', 'approved', 'rejected')),
  recipient text not null,
  sent_at timestamptz,
  error text,
  created_at timestamptz not null default now(),
  unique (request_user_id, kind)
);

alter table public.request_notifications enable row level security;
revoke all on table public.request_notifications from public, anon, authenticated;

create or replace function public.is_admin(p_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = p_user_id and role = 'admin'
  );
$$;

revoke all on function public.is_admin(uuid) from public, anon;
grant execute on function public.is_admin(uuid) to authenticated;

create or replace function public.current_user_request_status()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select request_status
  from public.chemist_applications
  where user_id = (select auth.uid());
$$;

revoke all on function public.current_user_request_status() from public, anon;
grant execute on function public.current_user_request_status() to authenticated;

create or replace function public.admin_review_chemist_request(
  p_user_id uuid,
  p_decision text,
  p_note text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  old_status text;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'Administrator access required' using errcode = '42501';
  end if;

  if p_decision not in ('approved', 'rejected') then
    raise exception 'Decision must be approved or rejected';
  end if;

  select request_status into old_status
  from public.chemist_applications
  where user_id = p_user_id
  for update;

  if old_status is null then
    raise exception 'Chemist request not found';
  end if;

  update public.chemist_applications
  set request_status = p_decision,
      access_status = case when p_decision = 'approved' then 'active' else 'suspended' end,
      reviewed_at = now(),
      reviewed_by = auth.uid(),
      review_note = nullif(btrim(coalesce(p_note, '')), '')
  where user_id = p_user_id;

  insert into public.request_status_history (
    request_user_id, old_status, new_status, changed_by, note
  ) values (
    p_user_id, old_status, p_decision, auth.uid(),
    nullif(btrim(coalesce(p_note, '')), '')
  );
end;
$$;

revoke all on function public.admin_review_chemist_request(uuid,text,text) from public, anon;
grant execute on function public.admin_review_chemist_request(uuid,text,text) to authenticated;

create or replace function public.handle_new_chemist_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  application_name text := nullif(btrim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), '');
  application_username text := lower(nullif(btrim(coalesce(new.raw_user_meta_data ->> 'username', '')), ''));
  application_university text := nullif(btrim(coalesce(new.raw_user_meta_data ->> 'university', '')), '');
  application_motivation text := btrim(coalesce(new.raw_user_meta_data ->> 'motivation', ''));
begin
  if new.email is null then
    raise exception 'An email address is required';
  end if;
  if application_name is null or char_length(application_name) > 120 then
    raise exception 'A valid full name is required';
  end if;
  if application_username is null or application_username !~ '^[a-z0-9_]{3,30}$' then
    raise exception 'Username must contain 3 to 30 letters, numbers, or underscores';
  end if;
  if application_university is null or char_length(application_university) > 200 then
    raise exception 'A valid university is required';
  end if;
  if char_length(application_motivation) not between 1 and 500 then
    raise exception 'A response of 1 to 500 characters is required';
  end if;

  insert into public.chemist_applications (
    user_id, full_name, email, username, university, motivation,
    access_status, request_status
  ) values (
    new.id, application_name, new.email, application_username,
    application_university, application_motivation, 'suspended', 'pending'
  );

  insert into public.user_roles (user_id, role)
  values (
    new.id,
    case when lower(new.email) = 'destinyosik2007@gmail.com' then 'admin' else 'member' end
  )
  on conflict (user_id) do update
  set role = excluded.role, updated_at = now();

  if lower(new.email) = 'destinyosik2007@gmail.com' then
    update auth.users
    set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
    where id = new.id;
  end if;

  return new;
end;
$$;

insert into public.user_roles (user_id, role)
select id,
  case when lower(email) = 'destinyosik2007@gmail.com' then 'admin' else 'member' end
from auth.users
on conflict (user_id) do update
set role = excluded.role, updated_at = now();

update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
where lower(email) = 'destinyosik2007@gmail.com';

drop function public.admin_search_chemist_applications(text,text,date,date,integer,integer);

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
  created_at timestamptz,
  username text,
  request_status text
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin(auth.uid()) then
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
    application.created_at,
    application.username,
    application.request_status
  from public.chemist_applications as application
  where (
    p_search is null
    or btrim(p_search) = ''
    or application.full_name ilike '%' || p_search || '%'
    or application.email ilike '%' || p_search || '%'
    or application.username ilike '%' || p_search || '%'
    or application.university ilike '%' || p_search || '%'
  )
  and (p_access_status is null or application.access_status = p_access_status)
  and (p_registered_after is null or application.created_at >= p_registered_after::timestamp at time zone 'UTC')
  and (p_registered_before is null or application.created_at < (p_registered_before + 1)::timestamp at time zone 'UTC')
  order by application.created_at desc
  limit least(greatest(coalesce(p_limit, 51), 1), 51)
  offset greatest(coalesce(p_offset, 0), 0);
end;
$$;

revoke all on function public.admin_search_chemist_applications(text,text,date,date,integer,integer) from public, anon;
grant execute on function public.admin_search_chemist_applications(text,text,date,date,integer,integer) to authenticated;

update public.chemist_applications
set request_status = 'approved',
    access_status = 'active'
where request_status = 'approved';

create or replace function public.admin_set_chemist_access(
  p_user_id uuid,
  p_access_status text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'Administrator access required' using errcode = '42501';
  end if;
  if p_user_id = auth.uid() then
    raise exception 'Administrators cannot suspend their own account';
  end if;
  if p_access_status not in ('active', 'suspended') then
    raise exception 'Invalid access status';
  end if;
  if public.is_admin(p_user_id) then
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

create or replace function public.current_user_has_premium_access()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.chemist_applications as application
    where application.user_id = auth.uid()
      and application.access_status = 'active'
      and application.request_status = 'approved'
  ) and (
    exists (
      select 1
      from public.premium_subscriptions as subscription
      where subscription.user_id = auth.uid()
        and subscription.status = 'active'
        and subscription.payment_status = 'paid'
        and subscription.expires_at > now()
    )
    or exists (
      select 1
      from public.premium_access_grants as membership_grant
      where membership_grant.user_id = auth.uid()
        and membership_grant.revoked_at is null
        and membership_grant.starts_at <= now()
        and membership_grant.expires_at > now()
    )
  );
$$;
