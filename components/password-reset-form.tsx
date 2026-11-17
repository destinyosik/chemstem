"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  requestPasswordReset,
  updatePassword,
  type AuthFormState,
} from "@/app/actions/auth";

type PasswordResetFormProps = {
  mode: "request" | "update";
};

const initialState: AuthFormState = {};

export function PasswordResetForm({ mode }: PasswordResetFormProps) {
  const action = mode === "request" ? requestPasswordReset : updatePassword;
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form className="auth-form" action={formAction}>
      {mode === "request" ? (
        <label>
          Email address
          <input autoComplete="email" name="email" required type="email" />
        </label>
      ) : (
        <>
          <label>
            New password
            <input autoComplete="new-password" minLength={8} name="password" required type="password" />
          </label>
          <label>
            Confirm new password
            <input autoComplete="new-password" minLength={8} name="confirm_password" required type="password" />
          </label>
        </>
      )}
      {state.error && <p className="form-message form-error" role="alert">{state.error}</p>}
      {state.message && <p className="form-message form-success" role="status">{state.message}</p>}
      <button className="button button-dark auth-submit" disabled={isPending} type="submit">
        {isPending ? "Please wait…" : mode === "request" ? "Send reset link" : "Update password"}
      </button>
      <p className="auth-switch">
        <Link href="/login">Return to login</Link>
      </p>
    </form>
  );
}
