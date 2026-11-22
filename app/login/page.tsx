import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { GoogleSignInForm } from "@/components/google-sign-in-form";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getCurrentUser } from "@/lib/auth";
import { getSafeReturnPath } from "@/lib/navigation";

type LoginPageProps = {
  searchParams: Promise<{ next?: string; error?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const [user, params] = await Promise.all([getCurrentUser(), searchParams]);
  const nextPath = getSafeReturnPath(params.next, "");

  if (user) {
    redirect(nextPath || "/account");
  }

  return (
    <>
      <SiteHeader user={user} />
      <main className="content-page page-shell">
        <section className="content-panel auth-panel">
          <span className="content-kicker">Welcome back</span>
          <h1>Log in to chemstem.</h1>
          <p>Pick up where your chemistry journey left off.</p>
          {params.error === "callback" && (
            <p className="form-message form-error" role="alert">
              That email link is invalid or expired. Request a new password reset or confirmation email.
            </p>
          )}
          {params.error === "google" && (
            <p className="form-message form-error" role="alert">
              Google sign-in could not start. Enable Google in Supabase Auth and verify the provider callback and site redirect URLs.
            </p>
          )}
          <AuthForm mode="login" nextPath={nextPath} />
          <GoogleSignInForm from="login" nextPath={nextPath} />
          <Link className="content-back" href="/"><span>←</span> Back to home</Link>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
