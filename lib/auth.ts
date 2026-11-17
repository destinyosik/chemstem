import "server-only";

import type { User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { getSupabaseCredentials } from "./supabase/env";
import { createReadOnlyServerClient } from "./supabase/server";

export async function getCurrentUser(): Promise<User | null> {
  if (!getSupabaseCredentials()) {
    return null;
  }

  const supabase = await createReadOnlyServerClient();
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    throw new Error(`Unable to verify the current user: ${error.message}`);
  }

  return data.user;
}

export function isPremiumUser(user: User | null): boolean {
  return user?.app_metadata?.subscription_tier === "premium";
}

export function isAdminUser(user: User | null): boolean {
  return user?.app_metadata?.role === "admin";
}

export async function requireActiveUser(
  returnTo: string,
  unauthenticatedPage: "/login" | "/register" = "/login",
): Promise<User> {
  const user = await getCurrentUser();

  if (!user) {
    redirect(`${unauthenticatedPage}?next=${encodeURIComponent(returnTo)}`);
  }

  const supabase = await createReadOnlyServerClient();
  const { data: status, error } = await supabase.rpc("current_user_access_status");

  if (error) {
    throw new Error(`Unable to verify account access: ${error.message}`);
  }

  if (status === "suspended") {
    redirect("/access-suspended");
  }

  if (status !== "active") {
    throw new Error("No chemist application is associated with this account.");
  }

  return user;
}
