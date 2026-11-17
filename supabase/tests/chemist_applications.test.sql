begin;

select plan(7);

select ok(
  (select relrowsecurity from pg_class where oid = 'public.chemist_applications'::regclass),
  'chemist application records have row-level security enabled'
);

select ok(
  not has_table_privilege('anon', 'public.chemist_applications', 'SELECT'),
  'anonymous clients cannot select private applications'
);

select ok(
  has_table_privilege('authenticated', 'public.chemist_applications', 'SELECT'),
  'authenticated selects are available for the admin-only RLS policy'
);

select ok(
  not has_table_privilege('authenticated', 'public.chemist_applications', 'UPDATE'),
  'authenticated clients cannot directly change private applications'
);

select ok(
  not has_function_privilege(
    'anon',
    'public.admin_search_chemist_applications(text,text,date,date,integer,integer)',
    'EXECUTE'
  ),
  'anonymous clients cannot call the admin search function'
);

select ok(
  not has_function_privilege(
    'anon',
    'public.admin_set_chemist_access(uuid,text)',
    'EXECUTE'
  ),
  'anonymous clients cannot change account access'
);

select ok(
  exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'chemist_applications'
      and policyname = 'Administrators can view chemist applications'
      and roles = array['authenticated'::name]
      and qual ilike '%admin%'
  ),
  'the table read policy is restricted to administrators'
);

select * from finish();

rollback;
