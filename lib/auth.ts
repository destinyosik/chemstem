import "server-only";

import { isAuthSessionMissingError, type User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { getSupabaseCredentials } from "./supabase/env";
import { isMissingSupabaseRpc } from "./supabase/errors";
import { createReadOnlyServerClient } from "./supabase/server";

export async function getCurrentUser(): Promise<User | null> {
  if (!getSupabaseCredentials()) {
    return null;
  }

  const supabase = await createReadOnlyServerClient();
  const { data, error } = await supabase.auth.getUser();

  if (error && !isAuthSessionMissingError(error)) {
    throw new Error(`Unable to verify the current user: ${error.message}`);
  }

  return data.user;
}

export async function isPremiumUser(user: User | null): Promise<boolean> {
  if (!user) {
    return false;
  }

  const supabase = await createReadOnlyServerClient();
  const { data, error } = await supabase.rpc("current_user_has_premium_access");

  if (error) {
    if (isMissingSupabaseRpc(error)) {
      console.warn("Premium access RPC is unavailable; treating the account as Free until its database migration is applied.");
      return false;
    }
    throw new Error(`Unable to verify Premium membership: ${error.message}`);
  }

  return data === true;
}

export function isAdminUser(user: User | null): boolean {
  return user?.app_metadata?.role === "admin";
}

export async function requireSessionUser(
  returnTo: string,
): Promise<User> {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(returnTo)}`);
  }
  return user;
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
  const { data: requestStatus, error: requestError } = await supabase.rpc(
    "current_user_request_status",
  );

  if (requestError && !isMissingSupabaseRpc(requestError)) {
    throw new Error(`Unable to verify your account request: ${requestError.message}`);
  }

  if (requestError) {
    console.warn("Chemist request-status RPC is unavailable; account access will still be checked.");
  } else if (requestStatus === "pending") {
    redirect("/account?status=pending");
  } else if (requestStatus === "rejected") {
    redirect("/account?status=rejected");
  }

  const { data: status, error } = await supabase.rpc("current_user_access_status");

  if (error && !isMissingSupabaseRpc(error)) {
    throw new Error(`Unable to verify account access: ${error.message}`);
  }

  if (error) {
    console.warn("Account access-status RPC is unavailable; allowing the authenticated Free learning routes.");
  } else if (status === "suspended") {
    redirect("/access-suspended");
  } else if (status !== "active") {
    throw new Error("No chemist application is associated with this account.");
  }

  return user;
}
