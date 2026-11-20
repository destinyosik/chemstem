begin;

select plan(28);

select ok(
  (select relrowsecurity from pg_class where oid = 'public.chemistry_industries'::regclass),
  'industry categories have row-level security enabled'
);

select ok(
  (select relrowsecurity from pg_class where oid = 'public.chemistry_jobs'::regclass),
  'job records have row-level security enabled'
);

select ok(
  (select relrowsecurity from pg_class where oid = 'public.chemistry_job_update_logs'::regclass),
  'job update logs have row-level security enabled'
);

select ok(
  not has_table_privilege('anon', 'public.chemistry_industries', 'SELECT'),
  'anonymous clients cannot directly read industry records'
);

select ok(
  not has_table_privilege('authenticated', 'public.chemistry_industries', 'SELECT'),
  'members must use the active industry listing function'
);

select ok(
  has_function_privilege('anon', 'public.list_chemistry_industries()', 'EXECUTE'),
  'visitors can browse active industry categories'
);

select ok(
  has_function_privilege('authenticated', 'public.list_chemistry_industries()', 'EXECUTE'),
  'members can browse active industry categories'
);

select ok(
  not has_table_privilege('anon', 'public.chemistry_jobs', 'SELECT'),
  'anonymous clients cannot directly read job records'
);

select ok(
  not has_table_privilege('authenticated', 'public.chemistry_jobs', 'SELECT'),
  'members must use the account-checked job search function'
);

select ok(
  not has_table_privilege('anon', 'public.chemistry_job_update_logs', 'SELECT'),
  'anonymous clients cannot read job update logs'
);

select ok(
  not has_table_privilege('authenticated', 'public.chemistry_job_update_logs', 'SELECT'),
  'members cannot read private job update logs'
);

select ok(
  not has_function_privilege(
    'anon',
    'public.search_approved_chemistry_jobs(text,text,integer,integer)',
    'EXECUTE'
  ),
  'anonymous clients cannot search member-only job listings'
);

select ok(
  has_function_privilege(
    'authenticated',
    'public.search_approved_chemistry_jobs(text,text,integer,integer)',
    'EXECUTE'
  ),
  'authenticated clients can request access-checked job searches'
);

select ok(
  not has_function_privilege(
    'anon',
    'public.submit_chemistry_job(text,text,text,text,text,text,text,text[],date,text,text)',
    'EXECUTE'
  ),
  'anonymous clients cannot submit job listings'
);

select ok(
  has_function_privilege(
    'authenticated',
    'public.submit_chemistry_job(text,text,text,text,text,text,text,text[],date,text,text)',
    'EXECUTE'
  ),
  'members can submit jobs through the account-checked function'
);

select ok(
  not has_function_privilege(
    'anon',
    'public.admin_create_chemistry_job(text,text,text,text,text,text,text,text[],date,text,text)',
    'EXECUTE'
  ),
  'anonymous clients cannot publish jobs as an administrator'
);

select ok(
  not has_function_privilege('anon', 'public.admin_review_chemistry_job(uuid,text)', 'EXECUTE'),
  'anonymous clients cannot approve or reject jobs'
);

select ok(
  not has_function_privilege('anon', 'public.admin_list_chemistry_jobs(text,integer)', 'EXECUTE'),
  'anonymous clients cannot read the moderation queue'
);

select ok(
  not has_function_privilege('anon', 'public.admin_list_chemistry_job_logs(integer)', 'EXECUTE'),
  'anonymous clients cannot read update logs through the admin function'
);

select ok(
  not has_function_privilege('anon', 'public.admin_list_chemistry_industries()', 'EXECUTE'),
  'anonymous clients cannot read admin-only industry settings'
);

select ok(
  has_table_privilege('service_role', 'public.chemistry_jobs', 'SELECT'),
  'trusted server role can inspect job records'
);

select ok(
  has_table_privilege('service_role', 'public.chemistry_job_update_logs', 'INSERT'),
  'trusted server role can record update attempts'
);

select is(
  (select count(*)::integer from public.chemistry_industries),
  11,
  'the migration seeds all eleven chemistry industries'
);

select throws_ok(
  $$select * from public.search_approved_chemistry_jobs(null, null, 50, 0)$$,
  '42501',
  'An active chemstem account is required to view job listings',
  'job search rejects requests without an active account'
);

select throws_ok(
  $$select public.submit_chemistry_job('laboratory-services', 'Chemist', 'Company', 'Lagos', 'Description', '', '', '{}', null, null, 'https://example.com')$$,
  '42501',
  'An active chemstem account is required to submit a job',
  'job submissions reject requests without an active account'
);

select throws_ok(
  $$select public.admin_create_chemistry_job('laboratory-services', 'Chemist', 'Company', 'Lagos', 'Description', '', '', '{}', null, null, 'https://example.com')$$,
  '42501',
  'Administrator access required',
  'job creation rejects requests without an administrator role'
);

select throws_ok(
  $$select public.admin_review_chemistry_job('00000000-0000-4000-8000-000000000001', 'approved')$$,
  '42501',
  'Administrator access required',
  'job review rejects requests without an administrator role'
);

select throws_ok(
  $$select * from public.admin_list_chemistry_industries()$$,
  '42501',
  'Administrator access required',
  'admin industry settings reject requests without an administrator role'
);

select * from finish();

rollback;
