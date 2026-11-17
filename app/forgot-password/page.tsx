import Link from "next/link";
import { PasswordResetForm } from "@/components/password-reset-form";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getCurrentUser } from "@/lib/auth";

export default async function ForgotPasswordPage() {
  const user = await getCurrentUser();

  return (
    <>
      <SiteHeader user={user} />
      <main className="content-page page-shell">
        <section className="content-panel auth-panel">
          <span className="content-kicker">Account recovery</span>
          <h1>Reset your password.</h1>
          <p>Enter your account email and we will send a secure reset link if it matches an account.</p>
          <PasswordResetForm mode="request" />
          <Link className="content-back" href="/login"><span>←</span> Back to login</Link>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
