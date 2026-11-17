"use server";

import { redirect } from "next/navigation";
import { getSafeReturnPath } from "@/lib/navigation";
import { getSupabaseCredentials } from "@/lib/supabase/env";
import { createServerClient } from "@/lib/supabase/server";

export type AuthFormState = {
  error?: string;
  message?: string;
};

function getCredentialsError(): AuthFormState | null {
  if (getSupabaseCredentials()) {
    return null;
  }

  return {
    error:
      "Account access is not available yet. Configure the Supabase environment variables to enable it.",
  };
}

function getSiteOrigin(): string | null {
  const configuredUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.NODE_ENV === "production" ? null : "http://localhost:3000");

  if (!configuredUrl) {
    return null;
  }

  try {
    const url = new URL(configuredUrl);
    if (!["http:", "https:"].includes(url.protocol)) return null;
    if (process.env.NODE_ENV === "production" && url.protocol !== "https:") return null;
    return url.origin;
  } catch {
    return null;
  }
}

function buildAuthCallback(siteOrigin: string, destination: string): string {
  const callback = new URL("/auth/callback", siteOrigin);
  callback.searchParams.set("next", destination);
  return callback.toString();
}

function addRegistrationConfirmation(path: string): string {
  const destination = new URL(path, "http://localhost");
  destination.searchParams.set("registered", "1");
  return `${destination.pathname}${destination.search}${destination.hash}`;
}

export async function signIn(
  _previousState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const credentialsError = getCredentialsError();
  if (credentialsError) return credentialsError;

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Enter your email address and password." };
  }

  const supabase = await createServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: `Unable to sign in: ${error.message}` };
  }

  redirect(getSafeReturnPath(formData.get("next"), "/account"));
}

export async function register(
  _previousState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const credentialsError = getCredentialsError();
  if (credentialsError) return credentialsError;

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("full_name") ?? "").trim();
  const university = String(formData.get("university") ?? "").trim();
  const motivation = String(formData.get("motivation") ?? "").trim();

  if (!email || !password || !fullName || !university || !motivation) {
    return { error: "Complete every required field to submit your application." };
  }

  if (fullName.length > 120 || university.length > 200) {
    return { error: "Your name must be 120 characters or fewer and university 200 characters or fewer." };
  }

  if (motivation.length > 500) {
    return { error: "Your response must be 500 characters or fewer." };
  }

  if (password.length < 8) {
    return { error: "Your password must be at least 8 characters long." };
  }

  const siteOrigin = getSiteOrigin();
  if (!siteOrigin) {
    return {
      error: "Password and email confirmation links need a valid NEXT_PUBLIC_SITE_URL.",
    };
  }

  const returnPath = getSafeReturnPath(formData.get("next"), "/account");
  const confirmedPath = addRegistrationConfirmation(returnPath);
  const supabase = await createServerClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, university, motivation },
      emailRedirectTo: buildAuthCallback(siteOrigin, confirmedPath),
    },
  });

  if (error) {
    return { error: `Unable to create your account: ${error.message}` };
  }

  if (!data.session) {
    return {
      message: "If this email can be registered, your application has been saved. Check your inbox for a confirmation link.",
    };
  }

  redirect(confirmedPath);
}

export async function requestPasswordReset(
  _previousState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const credentialsError = getCredentialsError();
  if (credentialsError) return credentialsError;

  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { error: "Enter the email address for your account." };

  const siteOrigin = getSiteOrigin();
  if (!siteOrigin) {
    return { error: "Password reset needs a valid NEXT_PUBLIC_SITE_URL." };
  }

  const supabase = await createServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: buildAuthCallback(siteOrigin, "/reset-password"),
  });

  if (error) {
    return { error: `Unable to request a password reset: ${error.message}` };
  }

  return {
    message: "If an account exists for that email, a password reset link is on its way.",
  };
}

export async function updatePassword(
  _previousState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const credentialsError = getCredentialsError();
  if (credentialsError) return credentialsError;

  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirm_password") ?? "");

  if (password.length < 8) {
    return { error: "Your password must be at least 8 characters long." };
  }

  if (password !== confirmPassword) {
    return { error: "The passwords do not match." };
  }

  const supabase = await createServerClient();
  const { data, error: sessionError } = await supabase.auth.getUser();

  if (sessionError) {
    throw new Error(`Unable to verify your password-reset session: ${sessionError.message}`);
  }

  if (!data.user) {
    return { error: "This password-reset link has expired. Request a new one to continue." };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return { error: `Unable to update your password: ${error.message}` };
  }

  redirect("/account?passwordUpdated=1");
}

export async function signOut(): Promise<void> {
  if (!getSupabaseCredentials()) {
    redirect("/");
  }

  const supabase = await createServerClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error(`Unable to sign out: ${error.message}`);
  }

  redirect("/");
}
