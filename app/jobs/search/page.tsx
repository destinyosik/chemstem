import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { JobCard, type ChemistryJob } from "@/components/jobs/job-card";
import { JobSearchForm } from "@/components/jobs/job-search-form";
import { requireActiveUser } from "@/lib/auth";
import {
  findSimilarChemistryRoles,
  isChemistryCareerSearch,
  relatedChemistryRoles,
} from "@/lib/jobs/industries";
import { createReadOnlyServerClient } from "@/lib/supabase/server";

type JobSearchPageProps = {
  searchParams: Promise<{ q?: string }>;
};

export default async function ChemistryJobSearchPage({ searchParams }: JobSearchPageProps) {
  const queryParams = await searchParams;
  const query = queryParams.q?.trim().slice(0, 120) ?? "";
  const user = await requireActiveUser(`/jobs/search?q=${encodeURIComponent(query)}`, "/register");
  const supabase = await createReadOnlyServerClient();
  const { data, error } = await supabase.rpc("search_approved_chemistry_jobs", {
    p_industry_slug: null,
    p_query: query || null,
    p_limit: 100,
    p_offset: 0,
  });
  if (error) {
    throw new Error(`Unable to search chemistry jobs: ${error.message}`);
  }
  const jobs = (data ?? []) as ChemistryJob[];
  let similarJobs: ChemistryJob[] = [];

  if (query && jobs.length === 0 && isChemistryCareerSearch(query)) {
    const { data: broadResults, error: broadError } = await supabase.rpc("search_approved_chemistry_jobs", {
      p_industry_slug: null,
      p_query: null,
      p_limit: 100,
      p_offset: 0,
    });
    if (broadError) {
      throw new Error(`Unable to find similar chemistry jobs: ${broadError.message}`);
    }

    const terms = query.toLowerCase().split(/[^a-z0-9]+/).filter((term) => term.length > 2);
    similarJobs = ((broadResults ?? []) as ChemistryJob[])
      .map((job) => ({
        job,
        score: terms.reduce((score, term) => {
          const text = `${job.title} ${job.industry_name} ${job.description} ${job.technical_skills.join(" ")}`.toLowerCase();
          return score + (text.includes(term) ? 1 : 0);
        }, 0),
      }))
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 12)
      .map((entry) => entry.job);
  }

  const chemistrySearch = isChemistryCareerSearch(query);
  const suggestedRoles = query && jobs.length === 0 && chemistrySearch
    ? findSimilarChemistryRoles(query)
    : relatedChemistryRoles;

  return (
    <>
      <SiteHeader user={user} />
      <main className="content-page page-shell chemistry-jobs-page">
        <header className="jobs-page-heading">
          <span className="content-kicker">Search all chemistry industries</span>
          <h1>What role are you looking for?</h1>
          <p>Search titles, employers, descriptions, and technical skills across all 11 industries.</p>
        </header>
        <JobSearchForm defaultValue={query} />

        {!query ? (
          <section className="job-search-suggestions">
            <h2>Popular chemistry searches</h2>
            <div className="job-role-chips">
              {relatedChemistryRoles.map((role) => (
                <Link href={`/jobs/search?q=${encodeURIComponent(role)}`} key={role}>{role}</Link>
              ))}
            </div>
          </section>
        ) : !chemistrySearch ? (
          <div className="job-empty-state job-search-error" role="status">
            <h2>Search outside chemistry</h2>
            <p>Sorry, this search is outside our chemistry career categories. Please try a related chemistry position.</p>
            <div className="job-role-chips">
              {relatedChemistryRoles.map((role) => (
                <Link href={`/jobs/search?q=${encodeURIComponent(role)}`} key={role}>{role}</Link>
              ))}
            </div>
          </div>
        ) : jobs.length ? (
          <JobResults title={`Search results for “${query}”`} jobs={jobs} />
        ) : (
          <section className="job-results-section">
            <div className="job-empty-state">
              <h2>No exact match for “{query}”</h2>
              <p>Try similar chemistry roles{similarJobs.length ? " or explore these related listings." : ". The role suggestions below help broaden your search."}</p>
            </div>
            <div className="job-role-chips">
              {suggestedRoles.map((role) => (
                <Link href={`/jobs/search?q=${encodeURIComponent(role)}`} key={role}>{role}</Link>
              ))}
            </div>
            {similarJobs.length > 0 && <JobResults title="Similar chemistry opportunities" jobs={similarJobs} />}
          </section>
        )}

        <Link className="content-back" href="/jobs/listings">Browse all approved jobs</Link>
      </main>
      <SiteFooter />
    </>
  );
}

function JobResults({ title, jobs }: { title: string; jobs: ChemistryJob[] }) {
  return (
    <section className="job-results-section">
      <div className="job-results-heading"><h2>{title}</h2><span>{jobs.length} jobs</span></div>
      <div className="job-results-list">{jobs.map((job) => <JobCard job={job} key={job.id} />)}</div>
    </section>
  );
}
