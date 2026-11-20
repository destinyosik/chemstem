import Link from "next/link";
import { notFound } from "next/navigation";
import {
  createAdminChemistryJob,
  reviewChemistryJob,
  triggerManualJobUpdate,
  updateChemistryIndustry,
} from "@/app/actions/jobs-admin";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { isAdminUser, requireActiveUser } from "@/lib/auth";
import { createReadOnlyServerClient } from "@/lib/supabase/server";

type AdminJob = {
  id: string;
  industry_slug: string;
  industry_name: string;
  title: string;
  company_name: string;
  location: string;
  description: string;
  qualifications: string;
  experience: string;
  technical_skills: string[];
  application_deadline: string | null;
  salary_text: string | null;
  application_url: string;
  source_name: string;
  discovered_at: string;
  status: "pending" | "approved" | "rejected" | "expired" | "closed";
  submitted_by: string | null;
};

type JobLog = {
  id: string;
  source_name: string;
  status: "success" | "no_source_configured" | "failed";
  triggered_by: "cron" | "admin";
  jobs_found: number;
  jobs_added: number;
  jobs_updated: number;
  jobs_expired: number;
  message: string;
  created_at: string;
};

type Industry = {
  slug: string;
  name: string;
  description: string;
  sort_order: number;
  active: boolean;
};

type AdminJobsPageProps = {
  searchParams: Promise<{ update?: string }>;
};

export default async function AdminJobsPage({ searchParams }: AdminJobsPageProps) {
  const [user, params] = await Promise.all([
    requireActiveUser("/admin/jobs"),
    searchParams,
  ]);
  if (!isAdminUser(user)) notFound();

  const supabase = await createReadOnlyServerClient();
  const [
    { data: jobsData, error: jobsError },
    { data: logsData, error: logsError },
    { data: industriesData, error: industriesError },
  ] = await Promise.all([
    supabase.rpc("admin_list_chemistry_jobs", { p_status: null, p_limit: 300 }),
    supabase.rpc("admin_list_chemistry_job_logs", { p_limit: 30 }),
    supabase.rpc("admin_list_chemistry_industries"),
  ]);
  if (jobsError) throw new Error(`Unable to load job submissions: ${jobsError.message}`);
  if (logsError) throw new Error(`Unable to load job update history: ${logsError.message}`);
  if (industriesError) throw new Error(`Unable to load chemistry industries: ${industriesError.message}`);

  const jobs = (jobsData ?? []) as AdminJob[];
  const logs = (logsData ?? []) as JobLog[];
  const industries = (industriesData ?? []) as Industry[];

  return (
    <>
      <SiteHeader user={user} />
      <main className="content-page page-shell admin-page">
        <header className="admin-heading">
          <span className="content-kicker">Private administration</span>
          <h1>Chemistry job engine</h1>
          <p>Review submitted jobs, manage industry categories, publish manual listings, and monitor permitted source updates.</p>
          <div className="content-links">
            <Link className="content-back" href="/admin">← Registered chemists</Link>
            <Link className="content-back" href="/admin/premium">Premium, payments and courses →</Link>
          </div>
        </header>

        <section className="admin-premium-section" aria-labelledby="job-update-title">
          <h2 id="job-update-title">Automatic job updates</h2>
          {params.update === "no_source_configured" && (
            <p className="form-message form-error" role="status">No job search was run because a permitted data source is not configured.</p>
          )}
          {params.update === "success" && (
            <p className="form-message form-success" role="status">The connected job source was searched and the result was logged.</p>
          )}
          {params.update === "failed" && (
            <p className="form-message form-error" role="alert">The connected job source update failed. Review the update log for details.</p>
          )}
          <p>Daily schedule: midnight West Africa Time. Configure Adzuna API credentials and a country code supported by Adzuna; otherwise, the system logs that no source search ran.</p>
          <form action={triggerManualJobUpdate}>
            <button className="button button-dark" type="submit">Run source update now</button>
          </form>
        </section>

        <section className="admin-premium-section" aria-labelledby="review-jobs-title">
          <h2 id="review-jobs-title">Job listings and submissions</h2>
          <p>Member-submitted listings stay private until approved. Imported Adzuna jobs retain their source link and discovery date.</p>
          {jobs.length ? (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr><th scope="col">Job</th><th scope="col">Industry</th><th scope="col">Source / discovered</th><th scope="col">Status</th><th scope="col">Review</th></tr>
                </thead>
                <tbody>
                  {jobs.map((job) => (
                    <tr key={job.id}>
                      <td><strong>{job.title}</strong><span className="admin-email">{job.company_name} · {job.location}</span><p>{job.description}</p></td>
                      <td>{job.industry_name}</td>
                      <td>{job.source_name}<span className="admin-email">{new Date(job.discovered_at).toLocaleDateString("en", { dateStyle: "medium" })}</span><a className="admin-email" href={job.application_url} rel="noreferrer" target="_blank">Original listing</a></td>
                      <td><span className={`admin-status ${job.status === "approved" ? "active" : job.status === "pending" ? "pending" : "suspended"}`}>{job.status}</span></td>
                      <td>
                        {job.status === "pending" || job.status === "approved" ? (
                          <form action={reviewChemistryJob} className="admin-premium-form">
                            <input name="job_id" type="hidden" value={job.id} />
                            {job.status === "pending" && <button className="admin-access-button" name="status" type="submit" value="approved">Approve</button>}
                            <button className="admin-access-button" name="status" type="submit" value={job.status === "pending" ? "rejected" : "closed"}>
                              {job.status === "pending" ? "Reject" : "Close"}
                            </button>
                          </form>
                        ) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <div className="coming-soon">No user submissions or job listings yet.</div>}
        </section>

        <section className="admin-premium-section" aria-labelledby="admin-add-job-title">
          <h2 id="admin-add-job-title">Manually add a job</h2>
          <p>Admin-created listings are published immediately. Verify the source and application link before posting.</p>
          <form action={createAdminChemistryJob} className="admin-content-form">
            <label>Industry<select defaultValue="" name="industry_slug" required><option disabled value="">Choose an industry</option>{industries.map((industry) => <option disabled={!industry.active} key={industry.slug} value={industry.slug}>{industry.name}{industry.active ? "" : " (inactive)"}</option>)}</select></label>
            <label>Job title<input maxLength={180} name="title" required /></label>
            <label>Company name<input maxLength={180} name="company_name" required /></label>
            <label>Location<input maxLength={180} name="location" required /></label>
            <label>Description<textarea maxLength={5000} name="description" required rows={4} /></label>
            <label>Qualifications<textarea maxLength={2000} name="qualifications" rows={3} /></label>
            <label>Experience<input maxLength={1000} name="experience" /></label>
            <label>Technical skills <span>Separate with commas</span><input maxLength={1000} name="technical_skills" /></label>
            <label>Application deadline<input name="application_deadline" type="date" /></label>
            <label>Salary, if public<input maxLength={120} name="salary_text" /></label>
            <label>Original application link<input name="application_url" placeholder="https://" required type="url" /></label>
            <button className="button button-dark" type="submit">Publish verified job</button>
          </form>
        </section>

        <section className="admin-premium-section" aria-labelledby="industries-title">
          <h2 id="industries-title">Industry categories</h2>
          <div className="admin-industry-list">
            {industries.map((industry) => (
              <form action={updateChemistryIndustry} className="admin-industry-form" key={industry.slug}>
                <input name="slug" type="hidden" value={industry.slug} />
                <label>Name<input defaultValue={industry.name} maxLength={120} name="name" required /></label>
                <label>Description<input defaultValue={industry.description} maxLength={500} name="description" required /></label>
                <label className="admin-industry-active"><input defaultChecked={industry.active} name="active" type="checkbox" /> Active</label>
                <button className="admin-access-button" type="submit">Save category</button>
              </form>
            ))}
          </div>
        </section>

        <section className="admin-premium-section" aria-labelledby="job-update-log-title">
          <h2 id="job-update-log-title">Automatic update logs</h2>
          {logs.length ? (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead><tr><th scope="col">Time</th><th scope="col">Source</th><th scope="col">Trigger</th><th scope="col">Status</th><th scope="col">Found / added / updated / expired</th><th scope="col">Message</th></tr></thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id}>
                      <td>{new Date(log.created_at).toLocaleString("en", { dateStyle: "medium", timeStyle: "short" })}</td>
                      <td>{log.source_name}</td><td>{log.triggered_by}</td>
                      <td><span className={`admin-status ${log.status === "success" ? "active" : log.status === "failed" ? "suspended" : "pending"}`}>{log.status.replaceAll("_", " ")}</span></td>
                      <td>{log.jobs_found} / {log.jobs_added} / {log.jobs_updated} / {log.jobs_expired}</td>
                      <td>{log.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <div className="coming-soon">No update attempts have been logged.</div>}
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
