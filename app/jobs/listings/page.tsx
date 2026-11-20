import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { requireActiveUser } from "@/lib/auth";
import { JobSearchForm } from "@/components/jobs/job-search-form";
import { JobCard, type ChemistryJob } from "@/components/jobs/job-card";
import { JobSubmissionForm } from "@/components/jobs/job-submission-form";
import { createReadOnlyServerClient } from "@/lib/supabase/server";

type JobListingsPageProps = {
  searchParams: Promise<{ q?: string }>;
};

export default async function JobListingsPage({ searchParams }: JobListingsPageProps) {
  const params = await searchParams;
  const user = await requireActiveUser("/jobs/listings", "/register");
  const search = params.q?.trim().slice(0, 120) ?? "";
  const supabase = await createReadOnlyServerClient();
  const [
    { data, error },
    { data: industryData, error: industryError },
  ] = await Promise.all([
    supabase.rpc("search_approved_chemistry_jobs", {
      p_industry_slug: null,
      p_query: search || null,
      p_limit: 100,
      p_offset: 0,
    }),
    supabase.rpc("list_chemistry_industries"),
  ]);
  if (error || industryError) {
    throw new Error(`Unable to load chemistry job listings: ${error?.message ?? industryError?.message}`);
  }
  const jobs = (data ?? []) as ChemistryJob[];
  const industries = (industryData ?? []) as { slug: string; name: string }[];

  return (
    <>
      <SiteHeader user={user} />
      <main className="content-page page-shell chemistry-jobs-page">
        <header className="jobs-page-heading">
          <span className="content-kicker">Member access · Chemistry careers</span>
          <h1>Search chemistry job listings.</h1>
          <p>Search approved jobs across all 11 chemistry industries. Apply on the original employer or source site.</p>
        </header>
        <JobSearchForm action="/jobs/listings" defaultValue={search} />
        <section className="job-results-section">
          <div className="job-results-heading">
            <h2>{search ? `Results for “${search}”` : "Newest opportunities"}</h2>
            <span>{jobs.length} {jobs.length === 1 ? "job" : "jobs"}</span>
          </div>
          {jobs.length ? (
            <div className="job-results-list">
              {jobs.map((job) => <JobCard job={job} key={job.id} />)}
            </div>
          ) : (
            <div className="job-empty-state">
              <h3>{search ? "No matching chemistry jobs yet" : "No approved job listings yet"}</h3>
              <p>{search ? "Try another chemistry role or industry. You can also suggest a job for admin review." : "When an approved job source is connected, new listings will appear here. You can also suggest a job for admin review."}</p>
            </div>
          )}
        </section>
        <JobSubmissionForm industries={industries} />
        <div className="content-links">
          <Link className="content-back" href="/jobs"><span>←</span> Browse industries</Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
