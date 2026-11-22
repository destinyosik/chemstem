import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { requireActiveUser } from "@/lib/auth";
import { JobSearchForm } from "@/components/jobs/job-search-form";
import { JobCard, type ChemistryJob } from "@/components/jobs/job-card";
import { JobSubmissionForm } from "@/components/jobs/job-submission-form";
import {
  chemistryIndustries,
  isChemistryCareerSearch,
  relatedChemistryRoles,
} from "@/lib/jobs/industries";
import { searchAdzunaChemistryJobs } from "@/lib/jobs/sync";
import { createReadOnlyServerClient } from "@/lib/supabase/server";
import { isMissingSupabaseRpc } from "@/lib/supabase/errors";

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
    liveResult,
  ] = await Promise.all([
    supabase.rpc("search_approved_chemistry_jobs", {
      p_industry_slug: null,
      p_query: search || null,
      p_limit: 100,
      p_offset: 0,
    }),
    supabase.rpc("list_chemistry_industries"),
    search && isChemistryCareerSearch(search)
      ? searchAdzunaChemistryJobs(search)
      : Promise.resolve(null),
  ]);
  const databaseSearchAvailable = !error;
  const searchAvailable = databaseSearchAvailable || liveResult?.status === "success";
  const industryLookupAvailable = !industryError || !isMissingSupabaseRpc(industryError);
  if (error && !isMissingSupabaseRpc(error)) {
    throw new Error(`Unable to search chemistry job listings: ${error.message}`);
  }
  if (industryError && !isMissingSupabaseRpc(industryError)) {
    throw new Error(`Unable to load chemistry industries: ${industryError.message}`);
  }
  const databaseJobs = databaseSearchAvailable ? ((data ?? []) as ChemistryJob[]) : [];
  const liveJobs = liveResult?.jobs ?? [];
  const liveJobUrls = new Set(liveJobs.map((job) => job.application_url));
  const jobs = [
    ...liveJobs,
    ...databaseJobs.filter((job) => !liveJobUrls.has(job.application_url)),
  ];
  const industries = industryLookupAvailable && industryData
    ? (industryData as { slug: string; name: string }[])
    : chemistryIndustries;

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
        {liveResult && (
          <p className="job-source-note" role="status">
            {liveResult.message}
          </p>
        )}
        {!searchAvailable && (
          <p className="job-source-note" role="status">
            Stored chemistry job search is unavailable until an administrator applies the chemistry job engine migration. No listings are being simulated.
          </p>
        )}
        {!databaseSearchAvailable && liveResult?.status === "success" && (
          <p className="job-source-note" role="status">
            These are live Adzuna results. Saved and admin-approved listings will be available after the job database migration is applied.
          </p>
        )}
        <section className="job-results-section">
          <div className="job-results-heading">
            <h2>{search ? `Results for “${search}”` : "Newest opportunities"}</h2>
            <span>{jobs.length} {jobs.length === 1 ? "job" : "jobs"}</span>
          </div>
          {search && !isChemistryCareerSearch(search) ? (
            <div className="job-empty-state job-search-error" role="status">
              <h3>Search outside chemistry</h3>
              <p>Sorry, this search is outside our chemistry career categories. Please try a related chemistry position.</p>
              <div className="job-role-chips">
                {relatedChemistryRoles.map((role) => (
                  <Link href={`/jobs/listings?q=${encodeURIComponent(role)}`} key={role}>{role}</Link>
                ))}
              </div>
            </div>
          ) : jobs.length ? (
            <div className="job-results-list">
              {jobs.map((job) => <JobCard job={job} key={job.id} />)}
            </div>
          ) : !searchAvailable ? (
            <div className="job-empty-state">
              <h3>Job search is being connected</h3>
              <p>Once the database job engine is installed, approved chemistry listings will appear here.</p>
            </div>
          ) : (
            <div className="job-empty-state">
              <h3>{search ? "No matching chemistry jobs yet" : "No approved job listings yet"}</h3>
              <p>{search ? "Try another chemistry role or industry. You can also suggest a job for admin review." : "When an approved job source is connected, new listings will appear here. You can also suggest a job for admin review."}</p>
            </div>
          )}
        </section>
        {databaseSearchAvailable && <JobSubmissionForm industries={industries} />}
        <div className="content-links">
          <Link className="content-back" href="/jobs"><span>←</span> Browse industries</Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
