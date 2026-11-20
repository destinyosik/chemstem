"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { requireActiveUser } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase/server";
import { getSiteOrigin } from "@/lib/site-url";

export type PremiumFormState = {
  error?: string;
  message?: string;
};

type PendingPayment = {
  amount_kobo: number;
  currency: string;
};

type PaystackInitializationResponse = {
  status?: boolean;
  message?: string;
  data?: { authorization_url?: string };
};

export async function startPremiumCheckout(
  _previousState: PremiumFormState,
  formData: FormData,
): Promise<PremiumFormState> {
  const planSlug = String(formData.get("plan_slug") ?? "");
  if (planSlug !== "monthly" && planSlug !== "annual") {
    return { error: "Choose an available Premium plan." };
  }

  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    return {
      error: "Secure checkout is not configured yet. Contact the site administrator.",
    };
  }

  const user = await requireActiveUser("/premium");
  if (!user.email) {
    return { error: "Add and confirm an email address before starting checkout." };
  }

  const reference = `chemstem_${randomUUID()}`;
  const supabase = await createServerClient();
  const { data: pendingRows, error: pendingError } = await supabase.rpc(
    "create_pending_premium_payment",
    { p_plan_slug: planSlug, p_reference: reference },
  );

  if (pendingError) {
    throw new Error(`Unable to prepare the subscription payment: ${pendingError.message}`);
  }

  const pending = (pendingRows as PendingPayment[] | null)?.[0];
  if (
    !pending ||
    !Number.isSafeInteger(pending.amount_kobo) ||
    pending.amount_kobo <= 0 ||
    pending.currency !== "NGN"
  ) {
    throw new Error("The selected Premium plan returned invalid payment details.");
  }

  const response = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: user.email,
      amount: pending.amount_kobo,
      currency: pending.currency,
      reference,
      callback_url: `${getSiteOrigin()}/premium/status?reference=${encodeURIComponent(reference)}`,
      metadata: { user_id: user.id, plan_slug: planSlug },
    }),
    cache: "no-store",
  });
  const result = (await response.json()) as PaystackInitializationResponse;

  if (!response.ok || !result.status || !result.data?.authorization_url) {
    return {
      error: `Paystack could not start checkout: ${result.message ?? "Please try again later."}`,
    };
  }

  redirect(result.data.authorization_url);
}

export async function submitCreatorGuidance(
  _previousState: PremiumFormState,
  formData: FormData,
): Promise<PremiumFormState> {
  await requireActiveUser("/advanced");
  const subject = String(formData.get("subject") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();

  if (subject.length < 1 || subject.length > 160) {
    return { error: "Enter a subject of 1 to 160 characters." };
  }
  if (message.length < 1 || message.length > 3000) {
    return { error: "Enter a message of 1 to 3000 characters." };
  }

  const supabase = await createServerClient();
  const { error } = await supabase.rpc("submit_creator_guidance", {
    p_subject: subject,
    p_message: message,
  });

  if (error) {
    throw new Error(`Unable to submit your guidance request: ${error.message}`);
  }

  return { message: "Your request has been securely sent. We’ll be in touch." };
}
