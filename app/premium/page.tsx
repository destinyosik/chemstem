import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { isPremiumUser, requireActiveUser } from "@/lib/auth";

export default async function PremiumPage() {
  const user = await requireActiveUser("/premium");

  if (isPremiumUser(user)) {
    redirect("/advanced");
  }

  return (
    <>
      <SiteHeader user={user} />
      <main className="content-page page-shell">
        <section className="content-panel">
          <span className="content-kicker">chemstem Premium</span>
          <h1>Go further with chemistry.</h1>
          <p>
            Premium membership is the access level for advanced learning. Subscription checkout is not yet configured;
            no payment will be taken on this site.
          </p>
          <div className="coming-soon">
            Premium subscriptions will open when secure billing is connected to this independent chemstem project.
          </div>
          <Link className="content-back" href="/#learning-paths"><span>←</span> Back to learning paths</Link>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
