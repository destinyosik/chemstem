import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { isPremiumUser, requireActiveUser } from "@/lib/auth";
import { createReadOnlyServerClient } from "@/lib/supabase/server";
import { isMissingSupabaseRpc } from "@/lib/supabase/errors";
import { PremiumCheckoutForm } from "@/components/premium-checkout-form";

type PremiumPlan = {
  slug: "monthly" | "annual";
  name: string;
  duration_days: number;
  amount_kobo: number;
  currency: string;
};

export default async function PremiumPage() {
  const user = await requireActiveUser("/premium");
  const hasPremium = await isPremiumUser(user);

  const supabase = await createReadOnlyServerClient();
  const { data: planData, error } = await supabase.rpc("list_active_premium_plans");
  if (error && !isMissingSupabaseRpc(error)) {
    throw new Error(`Unable to load Premium plans: ${error.message}`);
  }
  const plans = (planData ?? []) as PremiumPlan[];
  const premiumPlansAvailable = !error;

  return (
    <>
      <SiteHeader user={user} />
      <main className="content-page page-shell">
        <section className="content-panel">
          <span className="content-kicker">chemstem Premium</span>
          <h1>Go further with chemistry.</h1>
          {hasPremium && (
            <p className="form-message form-success" role="status">
              Your Premium membership is active. Choose a plan below to renew and extend access.
            </p>
          )}
          <p>
            Unlock specialist career roadmaps, professional job guidance, curated chemistry opportunities, and direct creator guidance.
          </p>
          {!premiumPlansAvailable && (
            <div className="job-empty-state" role="status">
              <h2>Premium checkout is being connected</h2>
              <p>Your Free account remains available. Continue with university-level chemistry or search approved jobs across all industries.</p>
              <div className="content-links">
                <Link className="button button-dark" href="/account">Open your dashboard</Link>
                <Link className="button button-dark" href="/intermediate">Study Intermediate Chemistry</Link>
                <Link className="button button-dark" href="/jobs/listings">Search chemistry jobs</Link>
              </div>
            </div>
          )}
          <div className="premium-plan-grid">
            {plans.map((plan) => (
              <article className="premium-plan-card" key={plan.slug}>
                <span className="content-kicker">{plan.name}</span>
                <h2>{formatNaira(plan.amount_kobo, plan.currency)}</h2>
                <p>{plan.duration_days === 365 ? "12 months of Premium access" : "30 days of Premium access"}</p>
                <PremiumCheckoutForm isPremium={hasPremium} plan={plan} />
              </article>
            ))}
          </div>
          {premiumPlansAvailable && (
            <p className="advanced-disclaimer">Checkout is securely hosted by Paystack. Access is enabled only after Paystack verifies the payment and the signed webhook is processed. Renew by choosing a plan again before or after expiry.</p>
          )}
          <Link className="content-back" href="/#learning-paths"><span>←</span> Back to learning paths</Link>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

function formatNaira(amountKobo: number, currency: string): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amountKobo / 100);
}
