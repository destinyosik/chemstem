begin;

select plan(25);

select ok(
  (select relrowsecurity from pg_class where oid = 'public.premium_plans'::regclass),
  'premium plan records have row-level security enabled'
);

select ok(
  not has_table_privilege('anon', 'public.premium_plans', 'SELECT'),
  'anonymous clients cannot directly select premium plans'
);

select ok(
  (select relrowsecurity from pg_class where oid = 'public.premium_subscriptions'::regclass),
  'subscription records have row-level security enabled'
);

select ok(
  not has_table_privilege('anon', 'public.premium_subscriptions', 'SELECT'),
  'anonymous clients cannot read subscription records'
);

select ok(
  not has_table_privilege('authenticated', 'public.premium_subscriptions', 'SELECT'),
  'members cannot read other subscription records directly'
);

select ok(
  not has_table_privilege('authenticated', 'public.premium_subscriptions', 'INSERT'),
  'members cannot create subscription records directly'
);

select ok(
  (select relrowsecurity from pg_class where oid = 'public.premium_access_grants'::regclass),
  'manual access grants have row-level security enabled'
);

select ok(
  (select relrowsecurity from pg_class where oid = 'public.premium_courses'::regclass),
  'premium course records have row-level security enabled'
);

select ok(
  not has_table_privilege('authenticated', 'public.premium_courses', 'SELECT'),
  'members must use the membership-checked course function'
);

select ok(
  (select relrowsecurity from pg_class where oid = 'public.advanced_opportunities'::regclass),
  'advanced opportunities have row-level security enabled'
);

select ok(
  not has_table_privilege('authenticated', 'public.advanced_opportunities', 'SELECT'),
  'members must use the membership-checked opportunity function'
);

select ok(
  (select relrowsecurity from pg_class where oid = 'public.creator_guidance_requests'::regclass),
  'creator guidance requests have row-level security enabled'
);

select ok(
  not has_table_privilege('anon', 'public.creator_guidance_requests', 'SELECT'),
  'anonymous clients cannot read private guidance requests'
);

select ok(
  not has_table_privilege('authenticated', 'public.creator_guidance_requests', 'SELECT'),
  'members cannot read other guidance requests directly'
);

select ok(
  not has_function_privilege('anon', 'public.submit_creator_guidance(text,text)', 'EXECUTE'),
  'anonymous clients cannot submit creator guidance requests'
);

select ok(
  not has_function_privilege(
    'anon',
    'public.confirm_paystack_premium_payment(text,integer,text,text)',
    'EXECUTE'
  ),
  'anonymous clients cannot activate Premium through payment confirmation'
);

select ok(
  not has_function_privilege(
    'authenticated',
    'public.confirm_paystack_premium_payment(text,integer,text,text)',
    'EXECUTE'
  ),
  'members cannot activate Premium through payment confirmation'
);

select ok(
  has_function_privilege(
    'service_role',
    'public.confirm_paystack_premium_payment(text,integer,text,text)',
    'EXECUTE'
  ),
  'only the trusted webhook service role can confirm Premium payment'
);

select ok(
  not has_function_privilege('authenticated', 'public.record_paystack_failed_payment(text,text)', 'EXECUTE'),
  'members cannot set payment status to failed'
);

select ok(
  has_function_privilege('service_role', 'public.record_paystack_failed_payment(text,text)', 'EXECUTE'),
  'only the trusted webhook can record failed payment status'
);

select ok(
  has_function_privilege('authenticated', 'public.current_user_has_premium_access()', 'EXECUTE'),
  'authenticated pages can check their own Premium entitlement'
);

select ok(
  has_function_privilege('authenticated', 'public.admin_manage_premium_access(uuid,text,integer,text)', 'EXECUTE'),
  'subscription management RPC is callable and enforces admin identity internally'
);

select ok(
  not has_function_privilege('anon', 'public.admin_manage_premium_access(uuid,text,integer,text)', 'EXECUTE'),
  'anonymous clients cannot manage Premium membership'
);

select is(
  (select amount_kobo from public.premium_plans where slug = 'monthly'),
  200000,
  'monthly Premium price is stored as 2000 naira in kobo'
);

select is(
  (select amount_kobo from public.premium_plans where slug = 'annual'),
  2100000,
  'annual Premium price is stored as 21000 naira in kobo'
);

select * from finish();

rollback;
