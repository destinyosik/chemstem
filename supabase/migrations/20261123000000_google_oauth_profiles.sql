create or replace function public.handle_new_chemist_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  is_google_user boolean := coalesce(new.raw_app_meta_data ->> 'provider', '') = 'google';
  application_name text := coalesce(
    nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''),
    nullif(btrim(new.raw_user_meta_data ->> 'name'), '')
  );
  application_username text := lower(nullif(btrim(coalesce(new.raw_user_meta_data ->> 'username', '')), ''));
  application_university text := nullif(btrim(coalesce(new.raw_user_meta_data ->> 'university', '')), '');
  application_motivation text := btrim(coalesce(new.raw_user_meta_data ->> 'motivation', ''));
  email_username text;
begin
  if new.email is null then
    raise exception 'An email address is required';
  end if;
  if is_google_user then
    application_name := coalesce(application_name, nullif(split_part(new.email, '@', 1), ''));
    if application_username is null then
      email_username := regexp_replace(lower(split_part(new.email, '@', 1)), '[^a-z0-9_]', '', 'g');
      application_username := left(coalesce(nullif(email_username, ''), 'chemist'), 21)
        || '_' || substr(replace(new.id::text, '-', ''), 1, 8);
    end if;
    application_university := coalesce(application_university, 'Not provided');
    application_motivation := coalesce(
      nullif(application_motivation, ''),
      'Please complete your profile after signing in with Google.'
    );
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

create or replace function public.update_current_chemist_profile(
  p_university text,
  p_motivation text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'Authentication is required';
  end if;
  if char_length(btrim(coalesce(p_university, ''))) not between 1 and 200 then
    raise exception 'University must contain 1 to 200 characters';
  end if;
  if char_length(btrim(coalesce(p_motivation, ''))) not between 1 and 500 then
    raise exception 'Your response must contain 1 to 500 characters';
  end if;

  update public.chemist_applications
  set university = btrim(p_university),
      motivation = btrim(p_motivation)
  where user_id = current_user_id;

  if not found then
    raise exception 'No chemist profile is associated with this account';
  end if;

  update auth.users
  set raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb)
    || jsonb_build_object('university', btrim(p_university), 'motivation', btrim(p_motivation))
  where id = current_user_id;
end;
$$;

revoke all on function public.update_current_chemist_profile(text, text) from public, anon;
grant execute on function public.update_current_chemist_profile(text, text) to authenticated;

notify pgrst, 'reload schema';
