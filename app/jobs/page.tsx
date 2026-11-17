import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getCurrentUser } from "@/lib/auth";

export default async function JobsPage() {
  const user = await getCurrentUser();

  return (
    <>
      <SiteHeader user={user} />
      <main className="content-page page-shell">
        <section className="content-panel">
          <span className="content-kicker">Chemistry careers</span>
          <h1>Your next opportunity starts here.</h1>
          <p>
            Discover career possibilities across research, healthcare, energy, manufacturing, and the wider chemistry industry.
          </p>
          <p>Industry job listings are available to registered members.</p>
          <Link className="button button-dark" href={user ? "/jobs/listings" : "/register?next=/jobs/listings"}>
            {user ? "View industry listings" : "Create an account to explore jobs"}
          </Link>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
