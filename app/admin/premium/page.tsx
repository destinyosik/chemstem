import Link from "next/link";
import {
  addAdvancedOpportunity,
  addPremiumCourse,
  managePremiumAccess,
  updateCreatorGuidanceStatus,
} from "@/app/actions/premium-admin";
import { notFound } from "next/navigation";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { isAdminUser, requireActiveUser } from "@/lib/auth";
import { createReadOnlyServerClient } from "@/lib/supabase/server";

type AdminPremiumPageProps = {
  searchParams: Promise<{ q?: string }>;
};

type PremiumAccount = {
  user_id: string;
  full_name: string;
  email: string;
  access_status: "premium" | "free";
  access_source: "paystack" | "manual" | "none";
  expires_at: string | null;
  payment_status: "pending" | "paid" | "failed" | "none";
  payment_plan: string | null;
  amount_kobo: number | null;
  payment_reference: string | null;
};

type CreatorRequest = {
  id: string;
  full_name: string;
  email: string;
  subject: string;
  message: string;
  status: "new" | "in_progress" | "closed";
  created_at: string;
};

export default async function AdminPremiumPage({ searchParams }: AdminPremiumPageProps) {
  const params = await searchParams;
  const user = await requireActiveUser("/admin/premium");
  if (!isAdminUser(user)) {
    notFound();
  }

  const supabase = await createReadOnlyServerClient();
  const [
    { data: accountsData, error: accountsError },
    { data: requestsData, error: requestsError },
  ] = await Promise.all([
    supabase.rpc("admin_list_premium_accounts", {
      p_search: params.q?.trim().slice(0, 160) || null,
    }),
    supabase.rpc("admin_list_creator_guidance_requests"),
  ]);
  if (accountsError) {
    throw new Error(`Unable to load Premium accounts: ${accountsError.message}`);
  }
  if (requestsError) {
    throw new Error(`Unable to load creator guidance requests: ${requestsError.message}`);
  }

  const accounts = (accountsData ?? []) as PremiumAccount[];
  const requests = (requestsData ?? []) as CreatorRequest[];

  return (
    <>
      <SiteHeader user={user} />
      <main className="content-page page-shell admin-page">
        <header className="admin-heading">
          <span className="content-kicker">Private administration</span>
          <h1>Premium platform</h1>
          <p>Manage access, publish course and vacancy listings, and handle private creator guidance requests.</p>
          <Link className="content-back" href="/admin">← Return to chemist applications</Link>
        </header>

        <section className="admin-premium-section" aria-labelledby="membership-title">
          <h2 id="membership-title">Premium membership access</h2>
          <p>Paystack payments are activated only by the verified webhook. Manual grants are separately recorded and never marked as paid.</p>
          <form action="/admin/premium" className="admin-filters" method="get">
            <label>
              Search chemists
              <input defaultValue={params.q} maxLength={160} name="q" placeholder="Name or email" type="search" />
            </label>
            <button className="button button-dark" type="submit">Search</button>
          </form>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr><th scope="col">Chemist</th><th scope="col">Access</th><th scope="col">Source</th><th scope="col">Latest payment</th><th scope="col">Expires</th><th scope="col">Manage</th></tr>
              </thead>
              <tbody>
                {accounts.map((account) => (
                  <tr key={account.user_id}>
                    <td><strong>{account.full_name}</strong><a className="admin-email" href={`mailto:${account.email}`}>{account.email}</a></td>
                    <td><span className={`admin-status ${account.access_status === "premium" ? "active" : "free"}`}>{account.access_status}</span></td>
                    <td>{account.access_source === "paystack" ? "Verified Paystack payment" : account.access_source === "manual" ? "Admin manual grant" : "—"}</td>
                    <td>
                      {account.payment_status === "none" ? "No payment" : `${account.payment_status}${account.payment_plan ? ` · ${account.payment_plan}` : ""}${account.amount_kobo ? ` · ${formatNaira(account.amount_kobo)}` : ""}`}
                      {account.payment_reference && <small className="admin-payment-reference">{account.payment_reference}</small>}
                    </td>
                    <td>{account.expires_at ? new Date(account.expires_at).toLocaleDateString("en", { dateStyle: "medium" }) : "—"}</td>
                    <td>
                      <form action={managePremiumAccess} className="admin-premium-form">
                        <input name="user_id" type="hidden" value={account.user_id} />
                        {account.access_status === "premium" ? (
                          <button className="admin-access-button" name="action" type="submit" value="revoke">Revoke access</button>
                        ) : (
                          <>
                            <label className="sr-only" htmlFor={`grant-days-${account.user_id}`}>Manual grant duration in days</label>
                            <input id={`grant-days-${account.user_id}`} name="days" type="number" min="1" max="3650" defaultValue="30" />
                            <label className="sr-only" htmlFor={`grant-reason-${account.user_id}`}>Manual grant reason</label>
                            <input id={`grant-reason-${account.user_id}`} name="reason" type="text" maxLength={300} defaultValue="Professional development access" required />
                            <button className="admin-access-button" name="action" type="submit" value="grant">Grant days</button>
                          </>
                        )}
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="admin-result-count">Showing up to 500 registered accounts{params.q ? ` matching “${params.q.trim().slice(0, 160)}”` : ""}.</p>
        </section>

        <section className="admin-premium-section" aria-labelledby="courses-title">
          <h2 id="courses-title">Add a paid chemistry course</h2>
          <form action={addPremiumCourse} className="admin-content-form">
            <label>Course title<input name="title" maxLength={160} required /></label>
            <label>Description<textarea name="description" maxLength={4000} required rows={4} /></label>
            <label>Instructor<input name="instructor" maxLength={160} required /></label>
            <label>Price (NGN)<input name="price_naira" type="number" min="1" step="0.01" required /></label>
            <label>Course duration<input name="duration" maxLength={100} placeholder="e.g. 8 weeks" required /></label>
            <label>Learning outcomes <span>One per line</span><textarea name="learning_outcomes" rows={4} /></label>
            <label>Course materials <span>One item per line</span><textarea name="materials" rows={4} /></label>
            <label>Enrolment link<input name="enrollment_url" type="url" placeholder="https://" required /></label>
            <button className="button button-dark" type="submit">Publish course</button>
          </form>
        </section>

        <section className="admin-premium-section" aria-labelledby="opportunities-title">
          <h2 id="opportunities-title">Add a specialist chemistry vacancy</h2>
          <form action={addAdvancedOpportunity} className="admin-content-form">
            <label>Job title<input name="title" maxLength={180} required /></label>
            <label>Organization<input name="organization" maxLength={180} required /></label>
            <label>Location<input name="location" maxLength={180} required /></label>
            <label>Employment type<input name="employment_type" maxLength={80} placeholder="e.g. Full-time" required /></label>
            <label>Description<textarea name="description" maxLength={4000} required rows={4} /></label>
            <label>Application link<input name="application_url" type="url" placeholder="https://" required /></label>
            <label>Closing date<input name="closing_at" type="datetime-local" /></label>
            <button className="button button-dark" type="submit">Publish opportunity</button>
          </form>
        </section>

        <section className="admin-premium-section" aria-labelledby="guidance-title">
          <h2 id="guidance-title">Creator guidance requests</h2>
          {requests.length ? (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr><th scope="col">Chemist</th><th scope="col">Request</th><th scope="col">Message</th><th scope="col">Received</th><th scope="col">Status</th></tr>
                </thead>
                <tbody>
                  {requests.map((request) => (
                    <tr key={request.id}>
                      <td><strong>{request.full_name}</strong><a className="admin-email" href={`mailto:${request.email}`}>{request.email}</a></td>
                      <td>{request.subject}</td>
                      <td className="admin-motivation">{request.message}</td>
                      <td>{new Date(request.created_at).toLocaleDateString("en", { dateStyle: "medium" })}</td>
                      <td>
                        <form action={updateCreatorGuidanceStatus} className="admin-premium-form">
                          <input name="request_id" type="hidden" value={request.id} />
                          <select aria-label={`Status for ${request.subject}`} defaultValue={request.status} name="status">
                            <option value="new">New</option>
                            <option value="in_progress">In progress</option>
                            <option value="closed">Closed</option>
                          </select>
                          <button className="admin-access-button" type="submit">Save</button>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <div className="coming-soon">There are no creator guidance requests yet.</div>}
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

function formatNaira(amountKobo: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 2,
  }).format(amountKobo / 100);
}
