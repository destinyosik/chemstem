"use client";

import { useActionState } from "react";
import {
  completeChemistProfile,
  type AuthFormState,
} from "@/app/actions/auth";

const initialState: AuthFormState = {};

type ChemistProfileCompletionFormProps = {
  university: string;
  motivation: string;
};

export function ChemistProfileCompletionForm({
  university,
  motivation,
}: ChemistProfileCompletionFormProps) {
  const [state, formAction, isPending] = useActionState(
    completeChemistProfile,
    initialState,
  );

  return (
    <form action={formAction} className="auth-form">
      <label>
        University or institution
        <input
          autoComplete="organization"
          defaultValue={university === "Not provided" ? "" : university}
          maxLength={200}
          name="university"
          required
          type="text"
        />
      </label>
      <label>
        Tell us about your chemistry journey
        <textarea
          defaultValue={motivation.startsWith("Please complete your profile") ? "" : motivation}
          maxLength={500}
          name="motivation"
          required
          rows={4}
        />
      </label>
      {state.error && <p className="form-message form-error" role="alert">{state.error}</p>}
      {state.message && <p className="form-message form-success" role="status">{state.message}</p>}
      <button className="button button-dark auth-submit" disabled={isPending} type="submit">
        {isPending ? "Saving…" : "Complete profile"}
      </button>
    </form>
  );
}
