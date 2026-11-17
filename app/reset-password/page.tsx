import Link from "next/link";
import { PasswordResetForm } from "@/components/password-reset-form";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getCurrentUser } from "@/lib/auth";

export default async function ResetPasswordPage() {
  const user = await getCurrentUser();

  return (
    <>
      <SiteHeader user={user} />
      <main className="content-page page-shell">
        <section className="content-panel auth-panel">
          <span className="content-kicker">Secure account recovery</span>
          <h1>Choose a new password.</h1>
          <p>Open this page from the reset link sent to your email, then choose a password with at least 8 characters.</p>
          <PasswordResetForm mode="update" />
          <Link className="content-back" href="/forgot-password"><span>←</span> Request another reset link</Link>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
