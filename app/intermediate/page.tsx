import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { requireActiveUser } from "@/lib/auth";

type IntermediatePageProps = {
  searchParams: Promise<{ registered?: string }>;
};

export default async function IntermediatePage({ searchParams }: IntermediatePageProps) {
  const [user, params] = await Promise.all([
    requireActiveUser("/intermediate", "/register"),
    searchParams,
  ]);

  return (
    <>
      <SiteHeader user={user} />
      <main className="content-page page-shell">
        <section className="content-panel">
          <span className="content-kicker">Account learning path · Intermediate</span>
          <h1>Intermediate Chemistry</h1>
          <p>
            Build on the foundations and connect chemical structure, reactions, and quantitative reasoning.
          </p>
          {params.registered === "1" && (
            <p className="form-message form-success" role="status">
              Your chemist application has been submitted and your account is ready.
            </p>
          )}
          <div className="coming-soon">Intermediate course material is being prepared for registered learners.</div>
          <Link className="content-back" href="/#learning-paths"><span>←</span> Back to learning paths</Link>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
