# chemstem

chemstem is the independent Next.js project and public brand. It uses the App Router, TypeScript, Tailwind CSS, and Supabase Auth.

## Run locally

1. Install Node.js 20.9 or later.
2. Install dependencies with `npm install`.
3. Copy `.env.example` to `.env.local` and set the Supabase URL, anon key, and site URL for the dedicated chemstem deployment.
4. Start the development server with `npm run dev`.

The public homepage and beginner lessons work without Supabase credentials. Authentication, registration, and private routes require Supabase configuration.

## Supabase setup

Apply `supabase/migrations/20261117000000_chemist_applications.sql` to the dedicated Supabase project, using the Supabase CLI or SQL editor. Configure the Auth site URL and allow the `/auth/callback` redirect for each deployment URL, including local development and Vercel preview/production URLs. Use the same origin for `NEXT_PUBLIC_SITE_URL`.

Registration creates the auth user and the database trigger stores the required name, university, and motivation response. The application table has RLS enabled, no `anon` privileges, and an admin-only select policy. Registration inserts happen in a database trigger; users cannot read or edit application records through the public Data API. Admin search and access changes use database functions that independently verify the authenticated user's `app_metadata.role` claim.

To authorize an administrator, set `app_metadata.role` to `admin` for that user's Supabase Auth record through a trusted server-side Admin API operation. Never set admin roles from signup/user metadata, and never expose a service-role key to the browser. Account suspension is enforced by server-side checks on member routes.

Password reset and signup confirmation use the `/auth/callback` route. Supabase Auth rate limits and email delivery settings should be configured for production.

## Access model

- `/beginner` and each `/beginner/[slug]` lesson are public.
- `/intermediate` and `/jobs/listings` require an active registered account.
- `/advanced` requires an active account with `app_metadata.subscription_tier` set to `premium`.
- `/admin` requires an active account with `app_metadata.role` set to `admin`.

The 20 beginner lessons use original explanations and link to OpenStax Chemistry 2e. A billing provider and Premium checkout are not configured.

## Deploy independently

Create a separate Supabase project and a separate Vercel project for chemstem. Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `NEXT_PUBLIC_SITE_URL` in the Vercel project's environment settings. Vercel detects and builds the Next.js app automatically. No DestinyTech configuration or credentials are used.

## Project structure

- `app/` — App Router pages, password recovery callback, styles, and server actions.
- `components/` — Shared navigation, footer, icons, account forms, and interactive lesson quizzes.
- `lib/lessons/beginner.ts` — The 20 original, sourced beginner chemistry lessons.
- `lib/auth.ts` — Server-verified identity, active-access, premium, and admin helpers.
- `lib/supabase/` — Supabase environment validation and cookie-based server clients.
- `supabase/migrations/` — Private application schema, RLS policy, triggers, and protected RPCs.
- `middleware.ts` — Supabase session refresh for server-rendered routes.
- `.env.example` — Public Supabase and site URL variable names; never commit real credentials.
