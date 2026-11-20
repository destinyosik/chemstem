create table public.chemistry_industries (
  slug text primary key check (slug ~ '^[a-z0-9-]+$'),
  name text not null unique check (char_length(btrim(name)) between 1 and 120),
  description text not null,
  sort_order smallint not null unique check (sort_order between 1 and 11),
  active boolean not null default true
);

insert into public.chemistry_industries (slug, name, description, sort_order)
values
  ('soap-detergent', 'Soap and Detergent Industries', 'Formulation, surfactants, quality, and production of cleaning products.', 1),
  ('cosmetics', 'Cosmetics Industries', 'Cosmetic formulation, product safety, quality, and manufacturing.', 2),
  ('pharmaceutical', 'Pharmaceutical Industries', 'Medicine development, GMP laboratories, quality, and manufacturing.', 3),
  ('paint', 'Paint Industries', 'Coatings formulation, pigments, testing, and production.', 4),
  ('water-treatment', 'Water Treatment Industries', 'Water chemistry, treatment operations, testing, and compliance.', 5),
  ('food-processing', 'Food Processing Industries', 'Food chemistry, safety, process quality, and product development.', 6),
  ('beverage-drink', 'Beverage and Drink Industries', 'Beverage formulation, laboratory analysis, and production quality.', 7),
  ('petroleum', 'Petroleum Industries', 'Petroleum analysis, refining, fuels, lubricants, and process chemistry.', 8),
  ('laboratory-services', 'Laboratory Services', 'Analytical testing, calibration, research, and laboratory quality systems.', 9),
  ('plastics-polymer', 'Plastics and Polymer Industries', 'Polymer synthesis, materials testing, compounding, and production.', 10),
  ('agrochemical', 'Agrochemical Industries', 'Agricultural chemicals, formulation, residue analysis, and regulation.', 11);

create table public.chemistry_jobs (
  id uuid primary key default gen_random_uuid(),
  industry_slug text not null references public.chemistry_industries (slug),
  title text not null check (char_length(btrim(title)) between 1 and 180),
  company_name text not null check (char_length(btrim(company_name)) between 1 and 180),
  location text not null check (char_length(btrim(location)) between 1 and 180),
  description text not null check (char_length(btrim(description)) between 1 and 5000),
  qualifications text not null default '',
  experience text not null default '',
  technical_skills text[] not null default '{}',
  application_deadline date,
  salary_text text,
  application_url text not null check (application_url ~ '^https?://'),
  source_name text not null,
  source_job_id text,
  source_url text,
  discovered_at timestamptz not null default now(),
  expires_at timestamptz,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'expired', 'closed')),
  submitted_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (source_url is null or source_url ~ '^https?://'),
  unique (source_name, source_job_id)
);

create index chemistry_jobs_active_industry_idx
  on public.chemistry_jobs (industry_slug, discovered_at desc)
  where status = 'approved';

create index chemistry_jobs_review_idx
  on public.chemistry_jobs (status, discovered_at desc);

create table public.chemistry_job_update_logs (
  id uuid primary key default gen_random_uuid(),
  source_name text not null,
  status text not null check (status in ('success', 'no_source_configured', 'failed')),
  triggered_by text not null check (triggered_by in ('cron', 'admin')),
  jobs_found integer not null default 0 check (jobs_found >= 0),
  jobs_added integer not null default 0 check (jobs_added >= 0),
  jobs_updated integer not null default 0 check (jobs_updated >= 0),
  jobs_expired integer not null default 0 check (jobs_expired >= 0),
  message text not null default '',
  created_at timestamptz not null default now()
);

alter table public.chemistry_industries enable row level security;
alter table public.chemistry_jobs enable row level security;
alter table public.chemistry_job_update_logs enable row level security;

revoke all on table public.chemistry_industries, public.chemistry_jobs,
  public.chemistry_job_update_logs from public, anon, authenticated;
grant select, insert, update, delete on public.chemistry_industries,
  public.chemistry_jobs, public.chemistry_job_update_logs to service_role;

create function public.list_chemistry_industries()
returns table (slug text, name text, description text, sort_order smallint)
language sql
stable
security definer
set search_path = ''
as $$
  select industry.slug, industry.name, industry.description, industry.sort_order
  from public.chemistry_industries as industry
  where industry.active
  order by industry.sort_order;
$$;

revoke all on function public.list_chemistry_industries() from public, anon, authenticated;
grant execute on function public.list_chemistry_industries() to anon, authenticated;

create function public.search_approved_chemistry_jobs(
  p_industry_slug text default null,
  p_query text default null,
  p_limit integer default 50,
  p_offset integer default 0
)
returns table (
  id uuid,
  industry_slug text,
  industry_name text,
  title text,
  company_name text,
  location text,
  description text,
  qualifications text,
  experience text,
  technical_skills text[],
  application_deadline date,
  salary_text text,
  application_url text,
  source_name text,
  discovered_at timestamptz,
  expires_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  search_text text := nullif(btrim(coalesce(p_query, '')), '');
begin
  if auth.uid() is null or not exists (
    select 1
    from public.chemist_applications as application
    where application.user_id = (select auth.uid())
      and application.access_status = 'active'
  ) then
    raise exception 'An active chemstem account is required to view job listings'
      using errcode = '42501';
  end if;

  if p_industry_slug is not null and not exists (
    select 1 from public.chemistry_industries as industry
    where industry.slug = p_industry_slug and industry.active
  ) then
    raise exception 'Unknown chemistry industry';
  end if;

  return query
  select job.id, job.industry_slug, industry.name, job.title, job.company_name,
    job.location, job.description, job.qualifications, job.experience,
    job.technical_skills, job.application_deadline, job.salary_text,
    job.application_url, job.source_name, job.discovered_at, job.expires_at
  from public.chemistry_jobs as job
  join public.chemistry_industries as industry on industry.slug = job.industry_slug
  where job.status = 'approved'
    and industry.active
    and (job.expires_at is null or job.expires_at > now())
    and (job.application_deadline is null or job.application_deadline >= current_date)
    and (p_industry_slug is null or job.industry_slug = p_industry_slug)
    and (
      search_text is null
      or job.title ilike '%' || search_text || '%'
      or job.company_name ilike '%' || search_text || '%'
      or job.description ilike '%' || search_text || '%'
      or job.qualifications ilike '%' || search_text || '%'
      or job.experience ilike '%' || search_text || '%'
      or array_to_string(job.technical_skills, ' ') ilike '%' || search_text || '%'
    )
  order by job.discovered_at desc, job.created_at desc
  limit least(greatest(coalesce(p_limit, 50), 1), 100)
  offset greatest(coalesce(p_offset, 0), 0);
end;
$$;

revoke all on function public.search_approved_chemistry_jobs(text, text, integer, integer)
  from public, anon;
grant execute on function public.search_approved_chemistry_jobs(text, text, integer, integer)
  to authenticated;

create function public.submit_chemistry_job(
  p_industry_slug text,
  p_title text,
  p_company_name text,
  p_location text,
  p_description text,
  p_qualifications text,
  p_experience text,
  p_technical_skills text[],
  p_application_deadline date,
  p_salary_text text,
  p_application_url text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  job_id uuid;
begin
  if auth.uid() is null or not exists (
    select 1 from public.chemist_applications
    where user_id = (select auth.uid()) and access_status = 'active'
  ) then
    raise exception 'An active chemstem account is required to submit a job'
      using errcode = '42501';
  end if;

  if not exists (
    select 1 from public.chemistry_industries
    where slug = p_industry_slug and active
  ) then
    raise exception 'Choose a valid chemistry industry';
  end if;

  if p_application_url !~ '^https://'
    or char_length(btrim(coalesce(p_title, ''))) not between 1 and 180
    or char_length(btrim(coalesce(p_company_name, ''))) not between 1 and 180
    or char_length(btrim(coalesce(p_location, ''))) not between 1 and 180
    or char_length(btrim(coalesce(p_description, ''))) not between 1 and 5000
    or coalesce(array_length(p_technical_skills, 1), 0) > 30 then
    raise exception 'The job details or application link are invalid';
  end if;

  insert into public.chemistry_jobs (
    industry_slug, title, company_name, location, description, qualifications,
    experience, technical_skills, application_deadline, salary_text,
    application_url, source_name, source_url, submitted_by, status
  ) values (
    p_industry_slug, btrim(p_title), btrim(p_company_name), btrim(p_location),
    btrim(p_description), left(btrim(coalesce(p_qualifications, '')), 2000),
    left(btrim(coalesce(p_experience, '')), 1000), coalesce(p_technical_skills, '{}'),
    p_application_deadline, nullif(left(btrim(coalesce(p_salary_text, '')), 120), ''),
    p_application_url, 'member_submission', p_application_url, (select auth.uid()), 'pending'
  )
  returning id into job_id;

  return job_id;
end;
$$;

revoke all on function public.submit_chemistry_job(text, text, text, text, text, text, text, text[], date, text, text)
  from public, anon;
grant execute on function public.submit_chemistry_job(text, text, text, text, text, text, text, text[], date, text, text)
  to authenticated;

create function public.admin_create_chemistry_job(
  p_industry_slug text,
  p_title text,
  p_company_name text,
  p_location text,
  p_description text,
  p_qualifications text,
  p_experience text,
  p_technical_skills text[],
  p_application_deadline date,
  p_salary_text text,
  p_application_url text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  job_id uuid;
begin
  if coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') <> 'admin' then
    raise exception 'Administrator access required' using errcode = '42501';
  end if;

  if not exists (
    select 1 from public.chemistry_industries
    where slug = p_industry_slug and active
  ) then
    raise exception 'Choose a valid chemistry industry';
  end if;

  if p_application_url !~ '^https://'
    or char_length(btrim(coalesce(p_title, ''))) not between 1 and 180
    or char_length(btrim(coalesce(p_company_name, ''))) not between 1 and 180
    or char_length(btrim(coalesce(p_location, ''))) not between 1 and 180
    or char_length(btrim(coalesce(p_description, ''))) not between 1 and 5000
    or coalesce(array_length(p_technical_skills, 1), 0) > 30 then
    raise exception 'The job details or application link are invalid';
  end if;

  insert into public.chemistry_jobs (
    industry_slug, title, company_name, location, description, qualifications,
    experience, technical_skills, application_deadline, salary_text,
    application_url, source_name, source_url, submitted_by, status
  ) values (
    p_industry_slug, btrim(p_title), btrim(p_company_name), btrim(p_location),
    btrim(p_description), left(btrim(coalesce(p_qualifications, '')), 2000),
    left(btrim(coalesce(p_experience, '')), 1000), coalesce(p_technical_skills, '{}'),
    p_application_deadline, nullif(left(btrim(coalesce(p_salary_text, '')), 120), ''),
    p_application_url, 'admin_manual', p_application_url, (select auth.uid()), 'approved'
  )
  returning id into job_id;

  return job_id;
end;
$$;

revoke all on function public.admin_create_chemistry_job(text, text, text, text, text, text, text, text[], date, text, text)
  from public, anon;
grant execute on function public.admin_create_chemistry_job(text, text, text, text, text, text, text, text[], date, text, text)
  to authenticated;

create function public.admin_review_chemistry_job(p_job_id uuid, p_status text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') <> 'admin' then
    raise exception 'Administrator access required' using errcode = '42501';
  end if;

  if p_status not in ('approved', 'rejected', 'closed') then
    raise exception 'Invalid job review status';
  end if;

  update public.chemistry_jobs
  set status = p_status, updated_at = now()
  where id = p_job_id and status in ('pending', 'approved');

  if not found then
    raise exception 'Job listing not found or cannot be reviewed';
  end if;
end;
$$;

revoke all on function public.admin_review_chemistry_job(uuid, text) from public, anon;
grant execute on function public.admin_review_chemistry_job(uuid, text) to authenticated;

create function public.admin_list_chemistry_jobs(p_status text default null, p_limit integer default 100)
returns table (
  id uuid, industry_slug text, industry_name text, title text, company_name text,
  location text, description text, qualifications text, experience text,
  technical_skills text[], application_deadline date, salary_text text,
  application_url text, source_name text, discovered_at timestamptz,
  status text, submitted_by uuid
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') <> 'admin' then
    raise exception 'Administrator access required' using errcode = '42501';
  end if;

  if p_status is not null
    and p_status not in ('pending', 'approved', 'rejected', 'expired', 'closed') then
    raise exception 'Invalid job status filter';
  end if;

  return query
  select job.id, job.industry_slug, industry.name, job.title, job.company_name,
    job.location, job.description, job.qualifications, job.experience,
    job.technical_skills, job.application_deadline, job.salary_text,
    job.application_url, job.source_name, job.discovered_at, job.status, job.submitted_by
  from public.chemistry_jobs as job
  join public.chemistry_industries as industry on industry.slug = job.industry_slug
  where p_status is null or job.status = p_status
  order by
    case when job.status = 'pending' then 0 else 1 end,
    job.discovered_at desc
  limit least(greatest(coalesce(p_limit, 100), 1), 500);
end;
$$;

revoke all on function public.admin_list_chemistry_jobs(text, integer) from public, anon;
grant execute on function public.admin_list_chemistry_jobs(text, integer) to authenticated;

create function public.admin_list_chemistry_job_logs(p_limit integer default 30)
returns table (
  id uuid, source_name text, status text, triggered_by text,
  jobs_found integer, jobs_added integer, jobs_updated integer,
  jobs_expired integer, message text, created_at timestamptz
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
  select log.id, log.source_name, log.status, log.triggered_by,
    log.jobs_found, log.jobs_added, log.jobs_updated, log.jobs_expired,
    log.message, log.created_at
  from public.chemistry_job_update_logs as log
  order by log.created_at desc
  limit least(greatest(coalesce(p_limit, 30), 1), 100);
end;
$$;

revoke all on function public.admin_list_chemistry_job_logs(integer) from public, anon;
grant execute on function public.admin_list_chemistry_job_logs(integer) to authenticated;

create function public.admin_list_chemistry_industries()
returns table (slug text, name text, description text, sort_order smallint, active boolean)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') <> 'admin' then
    raise exception 'Administrator access required' using errcode = '42501';
  end if;

  return query
  select industry.slug, industry.name, industry.description,
    industry.sort_order, industry.active
  from public.chemistry_industries as industry
  order by industry.sort_order;
end;
$$;

revoke all on function public.admin_list_chemistry_industries() from public, anon;
grant execute on function public.admin_list_chemistry_industries() to authenticated;

create function public.admin_update_chemistry_industry(
  p_slug text,
  p_name text,
  p_description text,
  p_active boolean
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

  if char_length(btrim(coalesce(p_name, ''))) not between 1 and 120
    or char_length(btrim(coalesce(p_description, ''))) not between 1 and 500
    or p_active is null then
    raise exception 'The industry details are invalid';
  end if;

  update public.chemistry_industries
  set name = btrim(p_name), description = btrim(p_description), active = p_active
  where slug = p_slug;

  if not found then
    raise exception 'Industry category not found';
  end if;
end;
$$;

revoke all on function public.admin_update_chemistry_industry(text, text, text, boolean)
  from public, anon;
grant execute on function public.admin_update_chemistry_industry(text, text, text, boolean)
  to authenticated;
