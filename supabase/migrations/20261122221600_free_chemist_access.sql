update public.chemist_applications
set request_status = 'approved',
    access_status = 'active'
where request_status = 'pending';

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
    application_university, application_motivation, 'active', 'approved'
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

notify pgrst, 'reload schema';
