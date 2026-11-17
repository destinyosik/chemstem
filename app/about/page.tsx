import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getCurrentUser } from "@/lib/auth";

export default async function AboutPage() {
  const user = await getCurrentUser();

  return (
    <>
      <SiteHeader user={user} />
      <main className="content-page page-shell">
        <section className="content-panel">
          <span className="content-kicker">About chemstem</span>
          <h1>Science opens doors.</h1>
          <p>
            chemstem is being built as a welcoming home for chemistry learning and career discovery:
            a place where students, lifelong learners, and professionals can take their next step.
          </p>
          <p>
            Learn at your own pace, deepen your expertise, and explore opportunities across the chemistry industry.
          </p>
          <Link className="button button-dark" href="/#learning-paths">Explore learning paths</Link>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
