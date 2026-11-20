# chemstem

chemstem is the independent Next.js project and public brand. It uses the App Router, TypeScript, Tailwind CSS, and Supabase Auth.

## Run locally

1. Install Node.js 20.9 or later.
2. Install dependencies with `npm install`.
3. Copy `.env.example` to `.env.local` and set the Supabase URL, publishable key, and site URL for the dedicated chemstem deployment.
4. Start the development server with `npm run dev`.

The public homepage and beginner lessons work without Supabase credentials. Authentication, registration, and private routes require Supabase configuration.

## Supabase setup

Apply `supabase/migrations/20261117000000_chemist_applications.sql` to the dedicated Supabase project, using the Supabase CLI or SQL editor. Configure the Supabase Auth site URL and allow the `/auth/callback` redirect for each deployment URL, including local development and Vercel preview/production URLs. Set the private server-side `SITE_URL` environment variable to the site origin.

Apply `supabase/migrations/20261120000000_advanced_premium_platform.sql` after the chemist-applications migration to enable Premium memberships, professional development content, creator guidance requests, and admin course/opportunity management.

Apply `supabase/migrations/20261121000000_chemistry_job_engine.sql` after the Premium migration to enable the private job directory, 11 managed industry categories, member job suggestions, administrator moderation, and update logs. Run the database security tests with `supabase test db` after applying the migrations.

Registration creates the auth user and the database trigger stores the required name, university, and motivation response. The application table has RLS enabled, no `anon` privileges, and an admin-only select policy. Registration inserts happen in a database trigger; users cannot read or edit application records through the public Data API. Admin search and access changes use database functions that independently verify the authenticated user's `app_metadata.role` claim.

To authorize an administrator, set `app_metadata.role` to `admin` for that user's Supabase Auth record through a trusted server-side Admin API operation. Never set admin roles from signup/user metadata, and never expose a service-role key to the browser. Account suspension is enforced by server-side checks on member routes.

Password reset uses the `/auth/callback` route and the server-side `SITE_URL`. Registration does not need an email confirmation redirect; set email confirmations off in Supabase Auth when immediate access after registration is required. Supabase Auth rate limits and email delivery settings should be configured for production.

## Prisma and Supabase Postgres

Prisma is configured for server-side PostgreSQL access. `DATABASE_URL` uses Supabase's transaction pooler for application connections, while `DIRECT_URL` uses the session pooler for migrations. Set both only in `.env.local` locally and in the private Vercel environment settings for deployments. Replace the sample project reference and password; URL-encode special characters in the password. Never commit real connection strings.

The existing Supabase Auth and application security policies remain managed by the SQL migration above. Prisma does not replace those policies; use it only from trusted server-side code and do not expose database credentials to browser code.

## Premium billing and professional development

The Advanced section is gated by a database entitlement check, not browser metadata. The starter Premium plans are ₦2,000 for 30 days and ₦21,000 for 365 days. Renewal starts another hosted checkout; access expiry is extended from the latest active paid expiry. Course and specialist-job records, membership payment history, manual admin grants, and creator guidance requests are private tables exposed only through access-checked database functions.

Paystack hosted checkout is used for Nigerian payments. Configure `PAYSTACK_SECRET_KEY` and `SUPABASE_SERVICE_ROLE_KEY` only as private server environment variables (never with a `NEXT_PUBLIC_` prefix). Set `SITE_URL` to the exact HTTPS deployment origin. In Paystack's dashboard, add the webhook URL `https://<your-domain>/api/webhooks/paystack` and subscribe to the `charge.success` and `charge.failed` events. The webhook verifies Paystack's signature and then independently verifies the transaction with Paystack before its service-role-only database function can change payment state. Only verified successful payments can activate access. The browser return URL only displays database status; it cannot grant membership.

Paystack must approve and configure your merchant account and settlement bank details for payouts. Use test secret keys and test transactions until the webhook flow is verified; switch to live keys only after production onboarding. Add these secrets to Vercel's project environment settings for Production and Preview as appropriate. For local webhook testing, use Paystack's documented webhook forwarding tooling.

The `/admin/premium` page is restricted to accounts with trusted `app_metadata.role = admin`. It can grant explicitly labeled manual access, revoke access, publish paid courses and chemistry vacancies, and update creator-request status. Manual grants do not alter payment records or claim a payment occurred.

## Chemistry job search and daily updates

The public `/jobs` page shows the managed 11-industry directory; job listings require an active chemstem account. Members can submit opportunities for admin review, while admins can approve or reject submissions, manage industry descriptions, add verified jobs, and inspect update logs at `/admin/jobs`. Direct table access to job records and update logs is revoked; server-rendered searches and admin views use database functions that check the caller's access.

Daily imports use the Adzuna Jobs API, which requires an Adzuna app ID and key from its developer portal. Set `ADZUNA_APP_ID`, `ADZUNA_APP_KEY`, and `ADZUNA_COUNTRY_CODE` to a two-letter Adzuna-supported country code in `.env.local` and Vercel. Adzuna country availability is provider-controlled; verify that its API supports the target market before configuring it. The source is not considered connected until all three values are set. Without them, the update log explicitly records `no_source_configured` and no job search is claimed. Imported jobs retain their first discovery date, link to Adzuna's original application redirect, and expire after 30 days unless refreshed. Adzuna returns description excerpts, not always full job descriptions; the original listing remains the source of complete details. Qualification and experience fields are left undisclosed unless a source explicitly provides them.

Set `CRON_SECRET` to a long random value in the local and Vercel server environments. `vercel.json` schedules `/api/cron/chemistry-jobs` at 23:00 UTC every day (00:00 West Africa Time). Vercel sends this secret as a bearer token; the route rejects unauthenticated requests. Vercel Cron is available only on supported deployment plans. The admin can also trigger a manual update, which uses the same server-only credentials and logs the outcome. Never prefix these secrets with `NEXT_PUBLIC_`.

## Access model

- `/beginner` and each `/beginner/[slug]` lesson are public.
- `/intermediate` and `/jobs/listings` require an active registered account.
- `/advanced` requires an active account with an unexpired Paystack-verified subscription or an explicitly recorded admin manual grant.
- `/admin` requires an active account with `app_metadata.role` set to `admin`.

The 20 beginner lessons use original explanations and link to OpenStax Chemistry 2e. Paystack checkout and the Premium webhook are implemented; production payments remain disabled until the database migration, webhook endpoint, and private provider credentials are configured.

## Deploy independently

Create a separate Supabase project and a separate Vercel project for chemstem. Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and private server-side `SITE_URL=https://chemstem.vercel.app` in the Vercel project's environment settings. The legacy `NEXT_PUBLIC_SUPABASE_ANON_KEY` is also supported. Vercel detects and builds the Next.js app automatically. No DestinyTech configuration or credentials are used.

## Project structure

- `app/` — App Router pages, password recovery callback, styles, and server actions.
- `components/` — Shared navigation, footer, icons, account forms, and interactive lesson quizzes.
- `lib/lessons/beginner.ts` — The 20 original, sourced beginner chemistry lessons.
- `lib/advanced/content.ts` — Original professional career roadmaps and chemistry job guidance.
- `lib/auth.ts` — Server-verified identity, active-access, premium, and admin helpers.
- `lib/supabase/` — Supabase environment validation and cookie-based server clients.
- `app/api/webhooks/paystack/` — Signed webhook and server-to-server payment verification.
- `app/admin/premium/` — Private subscription, course, opportunity, and guidance-request management.
- `supabase/migrations/` — Private application schema, RLS policy, triggers, and protected RPCs.
- `middleware.ts` — Supabase session refresh for server-rendered routes.
- `.env.example` — Placeholder names for public Supabase configuration and private payment, job-source, cron, and database credentials; never commit real credentials.
