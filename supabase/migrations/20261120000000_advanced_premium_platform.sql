create table public.premium_plans (
  slug text primary key check (slug in ('monthly', 'annual')),
  name text not null,
  duration_days integer not null check (duration_days between 1 and 366),
  amount_kobo integer not null check (amount_kobo > 0),
  currency text not null default 'NGN' check (currency = 'NGN'),
  active boolean not null default true
);

insert into public.premium_plans (slug, name, duration_days, amount_kobo)
values
  ('monthly', 'Monthly Premium', 30, 200000),
  ('annual', 'Annual Premium', 365, 2100000);

create table public.premium_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  plan_slug text not null references public.premium_plans (slug),
  provider text not null default 'paystack' check (provider = 'paystack'),
  reference text not null unique,
  provider_transaction_id text unique,
  amount_kobo integer not null check (amount_kobo > 0),
  currency text not null default 'NGN' check (currency = 'NGN'),
  status text not null default 'pending'
    check (status in ('pending', 'active', 'cancelled', 'expired', 'failed')),
  payment_status text not null default 'pending'
    check (payment_status in ('pending', 'paid', 'failed')),
  starts_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index premium_subscriptions_user_access_idx
  on public.premium_subscriptions (user_id, status, expires_at desc);

create table public.premium_access_grants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  granted_by uuid not null references auth.users (id),
  reason text not null check (char_length(btrim(reason)) between 1 and 300),
  starts_at timestamptz not null default now(),
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  check (expires_at > starts_at)
);

create index premium_access_grants_user_access_idx
  on public.premium_access_grants (user_id, expires_at desc)
  where revoked_at is null;

create table public.premium_courses (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(btrim(title)) between 1 and 160),
  description text not null check (char_length(btrim(description)) between 1 and 4000),
  instructor text not null check (char_length(btrim(instructor)) between 1 and 160),
  amount_kobo integer not null check (amount_kobo > 0),
  currency text not null default 'NGN' check (currency = 'NGN'),
  duration text not null check (char_length(btrim(duration)) between 1 and 100),
  learning_outcomes text[] not null default '{}',
  materials text[] not null default '{}',
  enrollment_url text not null check (enrollment_url ~ '^https://'),
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.advanced_opportunities (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(btrim(title)) between 1 and 180),
  organization text not null check (char_length(btrim(organization)) between 1 and 180),
  location text not null check (char_length(btrim(location)) between 1 and 180),
  employment_type text not null check (char_length(btrim(employment_type)) between 1 and 80),
  description text not null check (char_length(btrim(description)) between 1 and 4000),
  application_url text not null check (application_url ~ '^https://'),
  closing_at timestamptz,
  published boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.creator_guidance_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  subject text not null check (char_length(btrim(subject)) between 1 and 160),
  message text not null check (char_length(btrim(message)) between 1 and 3000),
  status text not null default 'new' check (status in ('new', 'in_progress', 'closed')),
  created_at timestamptz not null default now()
);

alter table public.premium_plans enable row level security;
alter table public.premium_subscriptions enable row level security;
alter table public.premium_access_grants enable row level security;
alter table public.premium_courses enable row level security;
alter table public.advanced_opportunities enable row level security;
alter table public.creator_guidance_requests enable row level security;

revoke all on table public.premium_plans, public.premium_subscriptions,
  public.premium_access_grants, public.premium_courses,
  public.advanced_opportunities, public.creator_guidance_requests
  from public, anon, authenticated;

create function public.current_user_has_premium_access()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.chemist_applications as application
    where application.user_id = (select auth.uid())
      and application.access_status = 'active'
  ) and (
    exists (
      select 1
      from public.premium_subscriptions as subscription
      where subscription.user_id = (select auth.uid())
        and subscription.status = 'active'
        and subscription.payment_status = 'paid'
        and subscription.expires_at > now()
    )
    or exists (
      select 1
      from public.premium_access_grants as membership_grant
      where membership_grant.user_id = (select auth.uid())
        and membership_grant.revoked_at is null
        and membership_grant.starts_at <= now()
        and membership_grant.expires_at > now()
    )
  );
$$;

revoke all on function public.current_user_has_premium_access() from public, anon;
grant execute on function public.current_user_has_premium_access() to authenticated;

create function public.list_active_premium_plans()
returns table (slug text, name text, duration_days integer, amount_kobo integer, currency text)
language sql
stable
security definer
set search_path = ''
as $$
  select plan.slug, plan.name, plan.duration_days, plan.amount_kobo, plan.currency
  from public.premium_plans as plan
  where plan.active
  order by plan.duration_days;
$$;

revoke all on function public.list_active_premium_plans() from public, anon;
grant execute on function public.list_active_premium_plans() to authenticated;

create function public.create_pending_premium_payment(p_plan_slug text, p_reference text)
returns table (amount_kobo integer, currency text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  selected_plan public.premium_plans%rowtype;
begin
  if current_user_id is null then
    raise exception 'Sign in is required to subscribe' using errcode = '42501';
  end if;

  if not exists (
    select 1 from public.chemist_applications
    where user_id = current_user_id and access_status = 'active'
  ) then
    raise exception 'An active chemstem account is required to subscribe';
  end if;

  if p_reference !~ '^chemstem_[a-f0-9-]{36}$' then
    raise exception 'Invalid payment reference';
  end if;

  select * into selected_plan
  from public.premium_plans as plan
  where plan.slug = p_plan_slug and plan.active;

  if not found then
    raise exception 'The selected subscription plan is unavailable';
  end if;

  insert into public.premium_subscriptions (
    user_id, plan_slug, reference, amount_kobo, currency
  ) values (
    current_user_id, selected_plan.slug, p_reference,
    selected_plan.amount_kobo, selected_plan.currency
  );

  return query select selected_plan.amount_kobo, selected_plan.currency;
end;
$$;

revoke all on function public.create_pending_premium_payment(text, text) from public, anon;
grant execute on function public.create_pending_premium_payment(text, text) to authenticated;

create function public.current_user_payment_status(p_reference text)
returns table (status text, payment_status text, expires_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select subscription.status, subscription.payment_status, subscription.expires_at
  from public.premium_subscriptions as subscription
  where subscription.user_id = (select auth.uid())
    and subscription.reference = p_reference;
$$;

revoke all on function public.current_user_payment_status(text) from public, anon;
grant execute on function public.current_user_payment_status(text) to authenticated;

create function public.confirm_paystack_premium_payment(
  p_reference text,
  p_amount_kobo integer,
  p_currency text,
  p_transaction_id text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  pending public.premium_subscriptions%rowtype;
  access_starts_at timestamptz;
begin
  select * into pending
  from public.premium_subscriptions as subscription
  where subscription.reference = p_reference
  for update;

  if not found
    or pending.provider <> 'paystack'
    or pending.amount_kobo <> p_amount_kobo
    or pending.currency <> p_currency
    or pending.provider_transaction_id is not null
       and pending.provider_transaction_id <> p_transaction_id then
    raise exception 'Payment does not match the pending subscription';
  end if;

  if pending.payment_status = 'paid' then
    if pending.provider_transaction_id = p_transaction_id then
      return true;
    end if;
    raise exception 'This subscription was confirmed with a different transaction';
  end if;

  if pending.payment_status <> 'pending' or pending.status <> 'pending' then
    raise exception 'This payment is no longer pending';
  end if;

  select greatest(coalesce(max(subscription.expires_at), now()), now())
  into access_starts_at
  from public.premium_subscriptions as subscription
  where subscription.user_id = pending.user_id
    and subscription.status = 'active'
    and subscription.payment_status = 'paid'
    and subscription.expires_at > now();

  update public.premium_subscriptions
  set payment_status = 'paid',
      status = 'active',
      provider_transaction_id = p_transaction_id,
      starts_at = access_starts_at,
      expires_at = access_starts_at + (
        select make_interval(days => plan.duration_days)
        from public.premium_plans as plan
        where plan.slug = pending.plan_slug
      ),
      updated_at = now()
  where id = pending.id;

  return true;
end;
$$;

revoke all on function public.confirm_paystack_premium_payment(text, integer, text, text)
  from public, anon, authenticated;
grant execute on function public.confirm_paystack_premium_payment(text, integer, text, text)
  to service_role;

create function public.record_paystack_failed_payment(p_reference text, p_transaction_id text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  pending public.premium_subscriptions%rowtype;
begin
  select * into pending
  from public.premium_subscriptions as subscription
  where subscription.reference = p_reference
  for update;

  if not found or pending.provider <> 'paystack' then
    raise exception 'Payment reference was not found';
  end if;

  if pending.payment_status = 'failed'
    and pending.provider_transaction_id = p_transaction_id then
    return true;
  end if;

  if pending.payment_status <> 'pending' or pending.status <> 'pending' then
    raise exception 'This payment is no longer pending';
  end if;

  update public.premium_subscriptions
  set payment_status = 'failed',
      status = 'failed',
      provider_transaction_id = p_transaction_id,
      updated_at = now()
  where id = pending.id;

  return true;
end;
$$;

revoke all on function public.record_paystack_failed_payment(text, text)
  from public, anon, authenticated;
grant execute on function public.record_paystack_failed_payment(text, text)
  to service_role;

create function public.list_premium_courses()
returns table (
  id uuid, title text, description text, instructor text, amount_kobo integer,
  currency text, duration text, learning_outcomes text[], materials text[], enrollment_url text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.current_user_has_premium_access() then
    raise exception 'Premium membership is required' using errcode = '42501';
  end if;

  return query
  select course.id, course.title, course.description, course.instructor,
    course.amount_kobo, course.currency, course.duration, course.learning_outcomes,
    course.materials, course.enrollment_url
  from public.premium_courses as course
  where course.published
  order by course.created_at desc;
end;
$$;

revoke all on function public.list_premium_courses() from public, anon;
grant execute on function public.list_premium_courses() to authenticated;

create function public.list_advanced_opportunities()
returns table (
  id uuid, title text, organization text, location text, employment_type text,
  description text, application_url text, closing_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.current_user_has_premium_access() then
    raise exception 'Premium membership is required' using errcode = '42501';
  end if;

  return query
  select opportunity.id, opportunity.title, opportunity.organization,
    opportunity.location, opportunity.employment_type, opportunity.description,
    opportunity.application_url, opportunity.closing_at
  from public.advanced_opportunities as opportunity
  where opportunity.published
    and (opportunity.closing_at is null or opportunity.closing_at > now())
  order by opportunity.closing_at nulls last, opportunity.created_at desc;
end;
$$;

revoke all on function public.list_advanced_opportunities() from public, anon;
grant execute on function public.list_advanced_opportunities() to authenticated;

create function public.submit_creator_guidance(p_subject text, p_message text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  request_id uuid;
begin
  if not public.current_user_has_premium_access() then
    raise exception 'Premium membership is required' using errcode = '42501';
  end if;

  if char_length(btrim(coalesce(p_subject, ''))) not between 1 and 160
    or char_length(btrim(coalesce(p_message, ''))) not between 1 and 3000 then
    raise exception 'Enter a subject and a message of up to 3000 characters';
  end if;

  insert into public.creator_guidance_requests (user_id, subject, message)
  values ((select auth.uid()), btrim(p_subject), btrim(p_message))
  returning id into request_id;

  return request_id;
end;
$$;

revoke all on function public.submit_creator_guidance(text, text) from public, anon;
grant execute on function public.submit_creator_guidance(text, text) to authenticated;

create function public.admin_list_premium_accounts(p_search text default null)
returns table (
  user_id uuid, full_name text, email text, access_status text,
  access_source text, expires_at timestamptz, payment_status text,
  payment_plan text, amount_kobo integer, payment_reference text
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') <> 'admin' then
    raise exception 'Administrator access required' using errcode = '42501';
  end if;

  return query
  select application.user_id, application.full_name, application.email,
    case
      when subscription.id is not null or grant_access.id is not null then 'premium'
      else 'free'
    end,
    case
      when subscription.id is not null then 'paystack'
      when grant_access.id is not null then 'manual'
      else 'none'
    end,
    greatest(subscription.expires_at, grant_access.expires_at),
    coalesce(recent_payment.payment_status, 'none'),
    recent_payment.plan_name,
    recent_payment.amount_kobo,
    recent_payment.reference
  from public.chemist_applications as application
  left join lateral (
    select paid.id, paid.expires_at
    from public.premium_subscriptions as paid
    where paid.user_id = application.user_id
      and paid.status = 'active'
      and paid.payment_status = 'paid'
      and paid.expires_at > now()
    order by paid.expires_at desc
    limit 1
  ) as subscription on true
  left join lateral (
    select manual.id, manual.expires_at
    from public.premium_access_grants as manual
    where manual.user_id = application.user_id
      and manual.revoked_at is null
      and manual.starts_at <= now()
      and manual.expires_at > now()
    order by manual.expires_at desc
    limit 1
  ) as grant_access on true
  left join lateral (
    select payment.payment_status, plan.name as plan_name,
      payment.amount_kobo, payment.reference
    from public.premium_subscriptions as payment
    join public.premium_plans as plan on plan.slug = payment.plan_slug
    where payment.user_id = application.user_id
    order by payment.created_at desc
    limit 1
  ) as recent_payment on true
  where p_search is null
    or btrim(p_search) = ''
    or application.full_name ilike '%' || p_search || '%'
    or application.email ilike '%' || p_search || '%'
  order by application.created_at desc
  limit 500;
end;
$$;

revoke all on function public.admin_list_premium_accounts(text) from public, anon;
grant execute on function public.admin_list_premium_accounts(text) to authenticated;

create function public.admin_manage_premium_access(
  p_user_id uuid,
  p_action text,
  p_days integer default null,
  p_reason text default null
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

  if not exists (
    select 1 from public.chemist_applications
    where user_id = p_user_id and access_status = 'active'
  ) then
    raise exception 'An active chemist account is required';
  end if;

  if p_action = 'grant' then
    if p_days is null or p_days not between 1 and 3650
      or char_length(btrim(coalesce(p_reason, ''))) not between 1 and 300 then
      raise exception 'Enter a valid grant duration and reason';
    end if;

    insert into public.premium_access_grants (
      user_id, granted_by, reason, starts_at, expires_at
    ) values (
      p_user_id, (select auth.uid()), btrim(p_reason), now(),
      now() + make_interval(days => p_days)
    );
  elsif p_action = 'revoke' then
    update public.premium_access_grants
    set revoked_at = now()
    where user_id = p_user_id and revoked_at is null and expires_at > now();

    update public.premium_subscriptions
    set status = 'cancelled', updated_at = now()
    where user_id = p_user_id
      and status = 'active'
      and payment_status = 'paid'
      and expires_at > now();
  else
    raise exception 'Invalid premium access action';
  end if;
end;
$$;

revoke all on function public.admin_manage_premium_access(uuid, text, integer, text)
  from public, anon;
grant execute on function public.admin_manage_premium_access(uuid, text, integer, text)
  to authenticated;

create function public.admin_create_premium_course(
  p_title text,
  p_description text,
  p_instructor text,
  p_amount_kobo integer,
  p_duration text,
  p_learning_outcomes text[],
  p_materials text[],
  p_enrollment_url text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  course_id uuid;
begin
  if coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') <> 'admin' then
    raise exception 'Administrator access required' using errcode = '42501';
  end if;

  if p_amount_kobo is null or p_amount_kobo <= 0
    or p_enrollment_url !~ '^https://'
    or coalesce(array_length(p_learning_outcomes, 1), 0) > 30
    or coalesce(array_length(p_materials, 1), 0) > 30 then
    raise exception 'Course details are invalid';
  end if;

  insert into public.premium_courses (
    title, description, instructor, amount_kobo, duration,
    learning_outcomes, materials, enrollment_url
  ) values (
    btrim(p_title), btrim(p_description), btrim(p_instructor), p_amount_kobo,
    btrim(p_duration), coalesce(p_learning_outcomes, '{}'),
    coalesce(p_materials, '{}'), p_enrollment_url
  )
  returning id into course_id;

  return course_id;
end;
$$;

revoke all on function public.admin_create_premium_course(text, text, text, integer, text, text[], text[], text)
  from public, anon;
grant execute on function public.admin_create_premium_course(text, text, text, integer, text, text[], text[], text)
  to authenticated;

create function public.admin_create_advanced_opportunity(
  p_title text,
  p_organization text,
  p_location text,
  p_employment_type text,
  p_description text,
  p_application_url text,
  p_closing_at timestamptz default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  opportunity_id uuid;
begin
  if coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') <> 'admin' then
    raise exception 'Administrator access required' using errcode = '42501';
  end if;

  if p_application_url !~ '^https://'
    or p_closing_at is not null and p_closing_at <= now() then
    raise exception 'Opportunity details are invalid';
  end if;

  insert into public.advanced_opportunities (
    title, organization, location, employment_type, description,
    application_url, closing_at
  ) values (
    btrim(p_title), btrim(p_organization), btrim(p_location),
    btrim(p_employment_type), btrim(p_description), p_application_url, p_closing_at
  )
  returning id into opportunity_id;

  return opportunity_id;
end;
$$;

revoke all on function public.admin_create_advanced_opportunity(text, text, text, text, text, text, timestamptz)
  from public, anon;
grant execute on function public.admin_create_advanced_opportunity(text, text, text, text, text, text, timestamptz)
  to authenticated;

create function public.admin_list_creator_guidance_requests()
returns table (
  id uuid, full_name text, email text, subject text, message text,
  status text, created_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') <> 'admin' then
    raise exception 'Administrator access required' using errcode = '42501';
  end if;

  return query
  select request.id, application.full_name, application.email,
    request.subject, request.message, request.status, request.created_at
  from public.creator_guidance_requests as request
  join public.chemist_applications as application on application.user_id = request.user_id
  order by request.created_at desc
  limit 100;
end;
$$;

revoke all on function public.admin_list_creator_guidance_requests() from public, anon;
grant execute on function public.admin_list_creator_guidance_requests() to authenticated;

create function public.admin_update_creator_guidance_status(p_request_id uuid, p_status text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') <> 'admin' then
    raise exception 'Administrator access required' using errcode = '42501';
  end if;

  if p_status not in ('new', 'in_progress', 'closed') then
    raise exception 'Invalid request status';
  end if;

  update public.creator_guidance_requests
  set status = p_status
  where id = p_request_id;

  if not found then
    raise exception 'Guidance request not found';
  end if;
end;
$$;

revoke all on function public.admin_update_creator_guidance_status(uuid, text)
  from public, anon;
grant execute on function public.admin_update_creator_guidance_status(uuid, text)
  to authenticated;
