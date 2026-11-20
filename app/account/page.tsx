import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { isPremiumUser, requireActiveUser } from "@/lib/auth";

type AccountPageProps = {
  searchParams: Promise<{ registered?: string; passwordUpdated?: string }>;
};

export default async function AccountPage({ searchParams }: AccountPageProps) {
  const [user, params] = await Promise.all([requireActiveUser("/account"), searchParams]);
  const hasPremium = await isPremiumUser(user);

  return (
    <>
      <SiteHeader user={user} />
      <main className="content-page page-shell">
        <section className="content-panel">
          <span className="content-kicker">Your chemstem account</span>
          <h1>Welcome back.</h1>
          <p>Signed in as {user.email ?? "chemstem member"}.</p>
          <p>Membership: {hasPremium ? "Premium" : "Free account"}.</p>
          {params.registered === "1" && (
            <p className="form-message form-success" role="status">
              Your chemist application has been submitted and your account is ready.
            </p>
          )}
          {params.passwordUpdated === "1" && (
            <p className="form-message form-success" role="status">
              Your password has been updated.
            </p>
          )}
          <div className="content-links">
            <Link className="button button-dark" href="/#learning-paths">Continue learning</Link>
            <Link className="button button-dark" href="/jobs">Explore chemistry careers</Link>
            {!hasPremium && <Link className="button button-dark" href="/premium">Explore Premium plans</Link>}
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
