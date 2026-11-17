import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getCurrentUser } from "@/lib/auth";

export default async function AccessSuspendedPage() {
  const user = await getCurrentUser();

  return (
    <>
      <SiteHeader user={user} />
      <main className="content-page page-shell">
        <section className="content-panel">
          <span className="content-kicker">Account access</span>
          <h1>Access is currently paused.</h1>
          <p>
            This account cannot access member areas at the moment. If you think this is a mistake,
            contact the chemstem administrator.
          </p>
          <Link className="content-back" href="/"><span>←</span> Back to home</Link>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
