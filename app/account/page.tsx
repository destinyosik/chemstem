import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { isPremiumUser, requireSessionUser } from "@/lib/auth";
import { createReadOnlyServerClient } from "@/lib/supabase/server";

type AccountPageProps = {
  searchParams: Promise<{ registered?: string; passwordUpdated?: string }>;
};

export default async function AccountPage({ searchParams }: AccountPageProps) {
  const [user, params] = await Promise.all([requireSessionUser("/account"), searchParams]);
  const hasPremium = await isPremiumUser(user);
  const supabase = await createReadOnlyServerClient();
  const { data: profile } = await supabase
    .from("chemist_applications")
    .select("full_name, username, email, university, motivation, request_status, access_status")
    .eq("user_id", user.id)
    .maybeSingle();

  return (
    <>
      <SiteHeader user={user} />
      <main className="content-page page-shell">
        <section className="content-panel">
          <span className="content-kicker">Your chemstem account</span>
          <h1>Welcome back.</h1>
          <p>Signed in as {user.email ?? "chemstem member"}.</p>
          <p>Membership: {hasPremium ? "Premium" : "Free account"}.</p>
          {profile && (
            <div className="account-profile">
              <p><strong>Full name:</strong> {profile.full_name}</p>
              <p><strong>Username:</strong> @{profile.username}</p>
              <p><strong>University:</strong> {profile.university}</p>
              {profile.request_status === "pending" && (
                <p className="form-message form-success" role="status">
                  Temporary account: your request is awaiting administrator approval.
                </p>
              )}
              {profile.request_status === "rejected" && (
                <p className="form-message form-error" role="alert">
                  Your account request was rejected. Contact the administrator for assistance.
                </p>
              )}
            </div>
          )}
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
