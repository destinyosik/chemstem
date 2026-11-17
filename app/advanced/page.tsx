import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { isPremiumUser, requireActiveUser } from "@/lib/auth";

export default async function AdvancedPage() {
  const user = await requireActiveUser("/advanced");

  if (!isPremiumUser(user)) {
    redirect("/premium");
  }

  return (
    <>
      <SiteHeader user={user} />
      <main className="content-page page-shell">
        <section className="content-panel">
          <span className="content-kicker">Premium learning path · Advanced</span>
          <h1>Advanced Chemistry</h1>
          <p>Explore specialist chemistry topics and deepen your subject expertise.</p>
          <div className="coming-soon">Advanced course material is being prepared for Premium members.</div>
          <Link className="content-back" href="/#learning-paths"><span>←</span> Back to learning paths</Link>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
