import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { requireActiveUser } from "@/lib/auth";

export default async function JobListingsPage() {
  const user = await requireActiveUser("/jobs/listings", "/register");

  return (
    <>
      <SiteHeader user={user} />
      <main className="content-page page-shell">
        <section className="content-panel">
          <span className="content-kicker">Member access · Chemistry careers</span>
          <h1>Industry job listings</h1>
          <p>These listings will be available to registered chemstem members.</p>
          <div className="coming-soon">There are no published job openings yet.</div>
          <Link className="content-back" href="/jobs"><span>←</span> Back to careers</Link>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
