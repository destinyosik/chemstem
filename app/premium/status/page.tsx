import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { requireActiveUser } from "@/lib/auth";
import { createReadOnlyServerClient } from "@/lib/supabase/server";

type PaymentStatusPageProps = {
  searchParams: Promise<{ reference?: string }>;
};

type PaymentStatus = {
  status: string;
  payment_status: string;
  expires_at: string | null;
};

export default async function PremiumStatusPage({ searchParams }: PaymentStatusPageProps) {
  const [user, params] = await Promise.all([
    requireActiveUser("/premium/status"),
    searchParams,
  ]);
  const reference = params.reference ?? "";
  if (!/^chemstem_[a-f0-9-]{36}$/.test(reference)) {
    return <PaymentStatusContent user={user} message="We could not identify this checkout. No Premium access was changed." />;
  }

  const supabase = await createReadOnlyServerClient();
  const { data, error } = await supabase.rpc("current_user_payment_status", {
    p_reference: reference,
  });
  if (error) {
    throw new Error(`Unable to load payment status: ${error.message}`);
  }

  const payment = (data as PaymentStatus[] | null)?.[0];
  if (!payment) {
    return <PaymentStatusContent user={user} message="This checkout is not linked to your account. No Premium access was changed." />;
  }

  if (payment.payment_status === "paid" && payment.status === "active") {
    return (
      <PaymentStatusContent
        user={user}
        message={`Payment verified. Premium access is active${payment.expires_at ? ` until ${new Date(payment.expires_at).toLocaleDateString("en", { dateStyle: "long" })}` : ""}.`}
        advanced
      />
    );
  }

  if (payment.payment_status === "failed") {
    return (
      <PaymentStatusContent
        user={user}
        message="Paystack confirmed that this payment did not complete. Premium access was not granted; you can safely retry checkout."
        retryHref="/premium"
      />
    );
  }

  return (
    <PaymentStatusContent
      user={user}
      message="Your payment is awaiting secure confirmation from Paystack. This page does not activate membership; refresh shortly to check the signed payment notification."
      refreshHref={`/premium/status?reference=${encodeURIComponent(reference)}`}
    />
  );
}

function PaymentStatusContent({
  user,
  message,
  advanced = false,
  refreshHref,
  retryHref,
}: {
  user: Awaited<ReturnType<typeof requireActiveUser>>;
  message: string;
  advanced?: boolean;
  refreshHref?: string;
  retryHref?: string;
}) {
  return (
    <>
      <SiteHeader user={user} />
      <main className="content-page page-shell">
        <section className="content-panel">
          <span className="content-kicker">Premium payment status</span>
          <h1>Checkout update</h1>
          <p>{message}</p>
          <div className="content-links">
            {advanced && <Link className="button button-dark" href="/advanced">Open Advanced Chemistry</Link>}
            {refreshHref && <Link className="button button-dark" href={refreshHref}>Check payment status again</Link>}
            {retryHref && <Link className="button button-dark" href={retryHref}>Choose a plan and retry</Link>}
            <Link className="content-back" href="/account">Return to account</Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
