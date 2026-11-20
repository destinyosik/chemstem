"use client";

import { useActionState } from "react";
import { submitCreatorGuidance, type PremiumFormState } from "@/app/actions/premium";

const initialState: PremiumFormState = {};

export function CreatorGuidanceForm() {
  const [state, formAction, isPending] = useActionState(submitCreatorGuidance, initialState);

  return (
    <form action={formAction} className="auth-form creator-guidance-form">
      <label>
        What would you like guidance about?
        <input maxLength={160} name="subject" required />
      </label>
      <label>
        Your message
        <textarea maxLength={3000} name="message" required rows={6} />
      </label>
      {state.error && <p className="form-message form-error" role="alert">{state.error}</p>}
      {state.message && <p className="form-message form-success" role="status">{state.message}</p>}
      <button className="button button-dark auth-submit" disabled={isPending} type="submit">
        {isPending ? "Sending…" : "Send guidance request"}
      </button>
    </form>
  );
}
