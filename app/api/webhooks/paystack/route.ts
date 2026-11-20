import { createHmac, timingSafeEqual } from "node:crypto";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type PaystackWebhookEvent = {
  event?: string;
  data?: { reference?: string };
};

type PaystackVerificationResponse = {
  status?: boolean;
  message?: string;
  data?: {
    id?: number;
    status?: string;
    reference?: string;
    amount?: number;
    currency?: string;
  };
};

function isValidSignature(rawBody: string, signature: string, secretKey: string): boolean {
  const expected = createHmac("sha512", secretKey).update(rawBody).digest();
  const received = Buffer.from(signature, "hex");
  return received.length === expected.length && timingSafeEqual(received, expected);
}

export async function POST(request: Request) {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    return Response.json({ error: "Payment webhook is not configured." }, { status: 500 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get("x-paystack-signature");
  if (!signature || !isValidSignature(rawBody, signature, secretKey)) {
    return Response.json({ error: "Invalid webhook signature." }, { status: 401 });
  }

  let event: PaystackWebhookEvent;
  try {
    event = JSON.parse(rawBody) as PaystackWebhookEvent;
  } catch {
    return Response.json({ error: "Invalid webhook payload." }, { status: 400 });
  }

  if (event.event !== "charge.success" && event.event !== "charge.failed") {
    return Response.json({ received: true });
  }

  const reference = event.data?.reference;
  if (!reference || reference.length > 100) {
    return Response.json({ error: "Missing payment reference." }, { status: 400 });
  }

  const verificationResponse = await fetch(
    `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
    {
      headers: { Authorization: `Bearer ${secretKey}` },
      cache: "no-store",
    },
  );
  if (!verificationResponse.ok) {
    return Response.json({ error: "Unable to verify payment with Paystack." }, { status: 502 });
  }

  const verification = (await verificationResponse.json()) as PaystackVerificationResponse;
  const payment = verification.data;
  if (
    event.event === "charge.failed" &&
    verification.status &&
    payment?.status === "failed" &&
    payment.reference === reference &&
    typeof payment.id === "number" &&
    Number.isSafeInteger(payment.id)
  ) {
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.rpc("record_paystack_failed_payment", {
      p_reference: reference,
      p_transaction_id: String(payment.id),
    });

    if (error) {
      console.error("Unable to record verified Paystack payment failure:", error.message);
      return Response.json({ error: "Unable to record payment status." }, { status: 500 });
    }

    return Response.json({ received: true });
  }

  if (event.event === "charge.failed") {
    return Response.json({ error: "Paystack payment verification did not match." }, { status: 400 });
  }

  if (
    !verification.status ||
    payment?.status !== "success" ||
    payment.reference !== reference ||
    payment.currency !== "NGN" ||
    typeof payment.amount !== "number" ||
    !Number.isSafeInteger(payment.amount) ||
    typeof payment.id !== "number" ||
    !Number.isSafeInteger(payment.id)
  ) {
    return Response.json({ error: "Paystack payment verification did not match." }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.rpc("confirm_paystack_premium_payment", {
    p_reference: reference,
    p_amount_kobo: payment.amount,
    p_currency: payment.currency,
    p_transaction_id: String(payment.id),
  });

  if (error) {
    console.error("Unable to activate verified Paystack subscription:", error.message);
    return Response.json({ error: "Unable to record verified payment." }, { status: 500 });
  }

  return Response.json({ received: true });
}
