import { createServerClient as createSupabaseServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseCredentials } from "./env";

export async function createServerClient() {
  const credentials = getSupabaseCredentials();

  if (!credentials) {
    throw new Error("Supabase is not configured for this deployment.");
  }

  const cookieStore = await cookies();

  return createSupabaseServerClient(
    credentials.url,
    credentials.anonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        },
      },
    },
  );
}

export async function createReadOnlyServerClient() {
  const credentials = getSupabaseCredentials();

  if (!credentials) {
    throw new Error("Supabase is not configured for this deployment.");
  }

  const cookieStore = await cookies();

  return createSupabaseServerClient(
    credentials.url,
    credentials.anonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        // Middleware refreshes auth cookies before server components read them.
        setAll() {},
      },
    },
  );
}
