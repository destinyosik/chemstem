import Link from "next/link";
import { ChemistProfileCompletionForm } from "@/components/chemist-profile-completion-form";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { isPremiumUser, requireSessionUser } from "@/lib/auth";
import { createReadOnlyServerClient } from "@/lib/supabase/server";

type AccountPageProps = {
  searchParams: Promise<{
    registered?: string;
    passwordUpdated?: string;
    profileUpdated?: string;
    status?: string;
  }>;
};

export default async function AccountPage({ searchParams }: AccountPageProps) {
  const [user, params] = await Promise.all([requireSessionUser("/account"), searchParams]);
  const hasPremium = await isPremiumUser(user);
  const supabase = await createReadOnlyServerClient();
  const { data: profile } = await supabase
    .from("chemist_applications")
    .select("full_name, email, university, motivation, access_status")
    .eq("user_id", user.id)
    .maybeSingle();

  return (
    <>
      <SiteHeader user={user} />
      <main className="content-page page-shell">
        <section className="content-panel">
          <span className="content-kicker">Your chemstem account</span>
          <h1>Welcome back{user.user_metadata?.full_name ? `, ${user.user_metadata.full_name}` : ""}.</h1>
          <p>Signed in as {user.email ?? "chemstem member"}.</p>
          <p>Membership: {hasPremium ? "Premium" : "Free account"}.</p>
          {profile && (
            <div className="account-profile">
              <p><strong>Full name:</strong> {profile.full_name}</p>
              <p><strong>University:</strong> {profile.university}</p>
              {profile.access_status === "suspended" && (
                <p className="form-message form-error" role="alert">
                  Your account access is inactive. Contact the administrator for assistance.
                </p>
              )}
            </div>
          )}
          {profile?.university === "Not provided" && (
            <section className="content-subsection">
              <h2>Complete your chemistry profile</h2>
              <p>Add your university and a short introduction to finish your chemist profile.</p>
              <ChemistProfileCompletionForm
                university={profile.university}
                motivation={profile.motivation}
              />
            </section>
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
          {params.profileUpdated === "1" && (
            <p className="form-message form-success" role="status">
              Your chemistry profile has been completed.
            </p>
          )}
          {params.status === "pending" && (
            <p className="form-message form-success" role="status">
              Your account is being reviewed. Your dashboard is available while review is pending.
            </p>
          )}
          {params.status === "rejected" && (
            <p className="form-message form-error" role="alert">
              Your account access is restricted. Contact the administrator for assistance.
            </p>
          )}
          <div className="content-links">
            <Link className="button button-dark" href="/intermediate">Study university-level chemistry</Link>
            <Link className="button button-dark" href="/jobs/listings">Search jobs in all industries</Link>
            <Link className="button button-dark" href="/#learning-paths">All learning paths</Link>
            <Link className="button button-dark" href="/jobs">Explore industries</Link>
            {!hasPremium && <Link className="button button-dark" href="/premium">Explore Premium plans</Link>}
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
