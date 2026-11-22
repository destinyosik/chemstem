import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { JobSearchForm } from "@/components/jobs/job-search-form";
import { JobCard, type ChemistryJob } from "@/components/jobs/job-card";
import { JobSubmissionForm } from "@/components/jobs/job-submission-form";
import { requireActiveUser } from "@/lib/auth";
import {
  getChemistryIndustry,
  isChemistryCareerSearch,
} from "@/lib/jobs/industries";
import { searchAdzunaChemistryJobs } from "@/lib/jobs/sync";
import { createReadOnlyServerClient } from "@/lib/supabase/server";
import { getSupabaseCredentials } from "@/lib/supabase/env";
import { isMissingSupabaseRpc } from "@/lib/supabase/errors";

type ActiveIndustry = {
  slug: string;
  name: string;
  description: string;
};

type IndustryJobsPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ q?: string }>;
};

export default async function IndustryJobsPage({ params, searchParams }: IndustryJobsPageProps) {
  const [{ slug }, queryParams] = await Promise.all([params, searchParams]);
  const user = await requireActiveUser(`/jobs/industry/${slug}`, "/register");
  let industry: ActiveIndustry | undefined;
  if (getSupabaseCredentials()) {
    const supabase = await createReadOnlyServerClient();
    const { data, error } = await supabase.rpc("list_chemistry_industries");
    if (error && !isMissingSupabaseRpc(error)) {
      throw new Error(`Unable to load chemistry industries: ${error.message}`);
    }
    if (error) {
      industry = getChemistryIndustry(slug);
    } else {
      industry = ((data ?? []) as ActiveIndustry[]).find((item) => item.slug === slug);
    }
  } else {
    industry = getChemistryIndustry(slug);
  }
  if (!industry) notFound();

  const query = queryParams.q?.trim().slice(0, 120) ?? "";
  const supabase = await createReadOnlyServerClient();
  const [{ data, error }, liveResult] = await Promise.all([
    supabase.rpc("search_approved_chemistry_jobs", {
      p_industry_slug: slug,
      p_query: query || null,
      p_limit: 100,
      p_offset: 0,
    }),
    query && isChemistryCareerSearch(query)
      ? searchAdzunaChemistryJobs(query)
      : Promise.resolve(null),
  ]);
  if (error && !isMissingSupabaseRpc(error)) {
    throw new Error(`Unable to load ${industry.name} jobs: ${error.message}`);
  }
  const databaseSearchAvailable = !error;
  const searchAvailable = databaseSearchAvailable || liveResult?.status === "success";
  const databaseJobs = (data ?? []) as ChemistryJob[];
  const liveJobs = (liveResult?.jobs ?? []).filter((job) => job.industry_slug === slug);
  const liveJobUrls = new Set(liveJobs.map((job) => job.application_url));
  const jobs = [
    ...liveJobs,
    ...databaseJobs.filter((job) => !liveJobUrls.has(job.application_url)),
  ];

  return (
    <>
      <SiteHeader user={user} />
      <main className="content-page page-shell chemistry-jobs-page">
        <nav className="lesson-breadcrumb" aria-label="Breadcrumb">
          <Link href="/jobs">Chemistry careers</Link><span aria-hidden="true">/</span><span>{industry.name}</span>
        </nav>
        <header className="jobs-page-heading">
          <span className="content-kicker">Industry jobs · Registered members</span>
          <h1>{industry.name}</h1>
          <p>{industry.description} Listings link directly to the original application source.</p>
        </header>
        <JobSearchForm action={`/jobs/industry/${slug}`} defaultValue={query} />
        {liveResult && (
          <p className="job-source-note" role="status">
            {liveResult.message}
          </p>
        )}
        {!searchAvailable && (
          <p className="job-source-note" role="status">
            Stored industry job listings are unavailable until an administrator applies the chemistry job engine migration. No listings are being simulated.
          </p>
        )}
        {!databaseSearchAvailable && liveResult?.status === "success" && (
          <p className="job-source-note" role="status">
            These are live Adzuna results. Saved and admin-approved listings will be available after the job database migration is applied.
          </p>
        )}
        <section className="job-results-section">
          <div className="job-results-heading">
            <h2>{query ? `Results for “${query}”` : "Newest opportunities"}</h2>
            <span>{jobs.length} {jobs.length === 1 ? "job" : "jobs"}</span>
          </div>
          {query && !isChemistryCareerSearch(query) ? (
            <div className="job-empty-state job-search-error" role="status">
              <h3>Search outside chemistry</h3>
              <p>Sorry, this search is outside our chemistry career categories. Please try a related chemistry position.</p>
            </div>
          ) : jobs.length ? (
            <div className="job-results-list">
              {jobs.map((job) => <JobCard job={job} key={job.id} />)}
            </div>
          ) : !searchAvailable ? (
            <div className="job-empty-state">
              <h3>Job search is being connected</h3>
              <p>Approved listings will appear here after the job database is installed.</p>
            </div>
          ) : (
            <div className="job-empty-state">
              <h3>No approved listings in this industry yet</h3>
              <p>There are no verified listings to show right now. Suggest an opportunity for admin review or check back after the next connected source update.</p>
            </div>
          )}
        </section>
        {databaseSearchAvailable && <JobSubmissionForm industrySlug={industry.slug} />}
        <Link className="content-back" href="/jobs">← Browse all chemistry industries</Link>
      </main>
      <SiteFooter />
    </>
  );
}
