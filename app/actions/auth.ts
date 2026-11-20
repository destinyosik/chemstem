"use server";

import { redirect } from "next/navigation";
import { isAuthSessionMissingError } from "@supabase/supabase-js";
import { getSafeReturnPath } from "@/lib/navigation";
import { getSupabaseCredentials } from "@/lib/supabase/env";
import { createServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { sendNewRequestEmail } from "@/lib/email";
import { getSiteOrigin } from "@/lib/site-url";

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

function buildAuthCallback(siteOrigin: string, destination: string): string {
  const callback = new URL("/auth/callback", siteOrigin);
  callback.searchParams.set("next", destination);
  return callback.toString();
}

function addRegistrationNotice(path: string): string {
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

  const { data: sessionData } = await supabase.auth.getUser();
  const isAdmin =
    sessionData.user?.app_metadata?.role === "admin";
  redirect(
    getSafeReturnPath(
      formData.get("next"),
      isAdmin ? "/admin" : "/account",
    ),
  );
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
  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  const university = String(formData.get("university") ?? "").trim();
  const motivation = String(formData.get("motivation") ?? "").trim();

  if (!email || !password || !fullName || !username || !university || !motivation) {
    return { error: "Complete every required field to submit your application." };
  }

  if (!/^[a-z0-9_]{3,30}$/.test(username)) {
    return { error: "Username must contain 3 to 30 letters, numbers, or underscores." };
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

  const returnPath = getSafeReturnPath(formData.get("next"), "/account");
  const registeredPath = addRegistrationNotice(returnPath);
  const supabase = await createServerClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, username, university, motivation },
    },
  });

  if (error) {
    return { error: `Unable to create your account: ${error.message}` };
  }

  let hasSession = Boolean(data.session);
  if (!hasSession) {
    const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
    hasSession = !loginError;
  }

  try {
    const admin = createSupabaseAdminClient();
    const { data: application } = await admin
      .from("chemist_applications")
      .select("user_id, full_name, email, username, motivation")
      .eq("email", email)
      .maybeSingle();

    if (application) {
      const { data: notification, error: notificationError } = await admin
        .from("request_notifications")
        .insert({
          request_user_id: application.user_id,
          kind: "submitted",
          recipient: process.env.ADMIN_NOTIFICATION_EMAIL || "destinyosik2007@gmail.com",
        })
        .select("id")
        .maybeSingle();

      if (!notificationError && notification) {
        try {
          await sendNewRequestEmail({
            requestId: application.user_id,
            fullName: application.full_name,
            username: application.username,
            email: application.email,
            motivation: application.motivation,
          });
          await admin
            .from("request_notifications")
            .update({ sent_at: new Date().toISOString() })
            .eq("id", notification.id);
        } catch (emailError) {
          await admin
            .from("request_notifications")
            .update({ error: emailError instanceof Error ? emailError.message : "Email delivery failed" })
            .eq("id", notification.id);
        }
      }
    }
  } catch {
    // The account and request remain saved if email delivery or notification setup fails.
  }

  if (!hasSession) {
    return {
      message: "Your account request was saved. Check your inbox if confirmation is enabled.",
    };
  }

  redirect(registeredPath);
}

export async function requestPasswordReset(
  _previousState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const credentialsError = getCredentialsError();
  if (credentialsError) return credentialsError;

  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { error: "Enter the email address for your account." };

  const supabase = await createServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: buildAuthCallback(getSiteOrigin(), "/reset-password"),
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

  if (sessionError && !isAuthSessionMissingError(sessionError)) {
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
