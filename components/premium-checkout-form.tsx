"use client";

import { useActionState } from "react";
import { startPremiumCheckout, type PremiumFormState } from "@/app/actions/premium";

type PremiumCheckoutFormProps = {
  isPremium: boolean;
  plan: {
    slug: "monthly" | "annual";
    name: string;
  };
};

const initialState: PremiumFormState = {};

export function PremiumCheckoutForm({ isPremium, plan }: PremiumCheckoutFormProps) {
  const [state, formAction, isPending] = useActionState(startPremiumCheckout, initialState);

  return (
    <form action={formAction}>
      <input name="plan_slug" type="hidden" value={plan.slug} />
      {state.error && <p className="form-message form-error" role="alert">{state.error}</p>}
      <button className="button button-dark auth-submit" disabled={isPending} type="submit">
        {isPending ? "Opening secure checkout…" : `${isPremium ? "Renew" : "Subscribe"} · ${plan.name}`}
      </button>
    </form>
  );
}
