import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getCurrentUser } from "@/lib/auth";
import { getSafeReturnPath } from "@/lib/navigation";

type RegisterPageProps = {
  searchParams: Promise<{ next?: string }>;
};

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const [user, params] = await Promise.all([getCurrentUser(), searchParams]);
  const nextPath = getSafeReturnPath(params.next, "");

  if (user) {
    redirect(nextPath || "/account");
  }

  return (
    <>
      <SiteHeader user={user} />
      <main className="content-page page-shell">
        <section className="content-panel auth-panel registration-panel">
          <span className="content-kicker">Your next step starts here</span>
          <h1>Create an Account as a Chemist</h1>
          <p>Share a little about your chemistry journey to create your account.</p>
          <AuthForm mode="register" nextPath={nextPath} />
          <Link className="content-back" href="/"><span>←</span> Back to home</Link>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
