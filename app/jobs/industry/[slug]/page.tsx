import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { JobSearchForm } from "@/components/jobs/job-search-form";
import { JobCard, type ChemistryJob } from "@/components/jobs/job-card";
import { JobSubmissionForm } from "@/components/jobs/job-submission-form";
import { requireActiveUser } from "@/lib/auth";
import { getChemistryIndustry } from "@/lib/jobs/industries";
import { createReadOnlyServerClient } from "@/lib/supabase/server";

type IndustryJobsPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ q?: string }>;
};

export default async function IndustryJobsPage({ params, searchParams }: IndustryJobsPageProps) {
  const [{ slug }, queryParams] = await Promise.all([params, searchParams]);
  const industry = getChemistryIndustry(slug);
  if (!industry) notFound();

  const user = await requireActiveUser(`/jobs/industry/${slug}`, "/register");
  const query = queryParams.q?.trim().slice(0, 120) ?? "";
  const supabase = await createReadOnlyServerClient();
  const { data, error } = await supabase.rpc("search_approved_chemistry_jobs", {
    p_industry_slug: slug,
    p_query: query || null,
    p_limit: 100,
    p_offset: 0,
  });
  if (error) {
    throw new Error(`Unable to load ${industry.name} jobs: ${error.message}`);
  }
  const jobs = (data ?? []) as ChemistryJob[];

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
        <section className="job-results-section">
          <div className="job-results-heading">
            <h2>{query ? `Results for “${query}”` : "Newest opportunities"}</h2>
            <span>{jobs.length} {jobs.length === 1 ? "job" : "jobs"}</span>
          </div>
          {jobs.length ? (
            <div className="job-results-list">
              {jobs.map((job) => <JobCard job={job} key={job.id} />)}
            </div>
          ) : (
            <div className="job-empty-state">
              <h3>No approved listings in this industry yet</h3>
              <p>There are no verified listings to show right now. Suggest an opportunity for admin review or check back after the next connected source update.</p>
            </div>
          )}
        </section>
        <JobSubmissionForm industrySlug={industry.slug} />
        <Link className="content-back" href="/jobs">← Browse all chemistry industries</Link>
      </main>
      <SiteFooter />
    </>
  );
}
