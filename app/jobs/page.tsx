import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { JobSearchForm } from "@/components/jobs/job-search-form";
import { getCurrentUser } from "@/lib/auth";
import { chemistryIndustries } from "@/lib/jobs/industries";
import { getSupabaseCredentials } from "@/lib/supabase/env";
import { createReadOnlyServerClient } from "@/lib/supabase/server";

type ActiveIndustry = {
  slug: string;
  name: string;
  description: string;
  sort_order: number;
};

type JobsPageProps = {
  searchParams: Promise<{ view?: string }>;
};

export default async function JobsPage({ searchParams }: JobsPageProps) {
  const [user, params] = await Promise.all([getCurrentUser(), searchParams]);
  const showIndustryDirectory = params.view === "industries";
  const supabaseConfigured = Boolean(getSupabaseCredentials());
  let industryDatabaseReady = supabaseConfigured;
  let industries: ActiveIndustry[] = [...chemistryIndustries].map(({ slug, name, description }, index) => ({
    slug,
    name,
    description,
    sort_order: index + 1,
  }));
  if (supabaseConfigured) {
    const supabase = await createReadOnlyServerClient();
    const { data, error } = await supabase.rpc("list_chemistry_industries");
    if (error) {
      if (error.code !== "PGRST202") {
        throw new Error(`Unable to load chemistry industries: ${error.message}`);
      }
      industryDatabaseReady = false;
    } else {
      industries = (data ?? []) as ActiveIndustry[];
    }
  }

  return (
    <>
      <SiteHeader user={user} />
      <main className={`content-page page-shell chemistry-jobs-page${showIndustryDirectory ? " job-industry-directory" : ""}`}>
        <header className="jobs-page-heading">
          <span className="content-kicker">Chemstem chemistry careers</span>
          <h1>Find your next chemistry opportunity.</h1>
          <p>Search chemistry roles or explore opportunities by industry. Listings include their original source and date discovered.</p>
        </header>

        <JobSearchForm action="/jobs/search" />
        {!industryDatabaseReady && (
          <p className="job-source-note" role="status">
            The starter industry directory is available, but database-managed categories and job listings require the chemistry job engine migration.
          </p>
        )}
        {!user && (
          <p className="job-access-note">
            Industry job listings are for registered chemists. <Link href="/register?next=/jobs/listings">Create an Account as a Chemist</Link> to view opportunities.
          </p>
        )}

        <section className="job-industry-section" aria-labelledby="job-industry-heading">
          <div className="job-section-heading">
            <div>
              <span className="section-kicker">Explore by sector</span>
              <h2 id="job-industry-heading">Chemistry industries</h2>
            </div>
            <Link className="job-all-link" href={user ? "/jobs/listings" : "/register?next=/jobs/listings"}>
              Search all industries →
            </Link>
          </div>

          <details className="job-industry-dropdown">
            <summary>Choose an industry <span aria-hidden="true">⌄</span></summary>
            <div className="job-industry-dropdown-list">
              {industries.map((industry, index) => (
                <Link
                  className="job-industry-row"
                  href={user ? `/jobs/industry/${industry.slug}` : `/register?next=${encodeURIComponent(`/jobs/industry/${industry.slug}`)}`}
                  key={industry.slug}
                >
                  <span className="job-industry-number">{String(index + 1).padStart(2, "0")}</span>
                  <span className="job-industry-copy">
                    <strong>{industry.name}</strong>
                    <span>{industry.description}</span>
                  </span>
                  <span className="job-industry-arrow" aria-hidden="true">↗</span>
                </Link>
              ))}
            </div>
          </details>

          <div className="job-industry-grid">
            {industries.map((industry, index) => (
              <Link
                className="job-industry-row"
                href={user ? `/jobs/industry/${industry.slug}` : `/register?next=${encodeURIComponent(`/jobs/industry/${industry.slug}`)}`}
                key={industry.slug}
              >
                <span className="job-industry-number">{String(index + 1).padStart(2, "0")}</span>
                <span className="job-industry-copy">
                  <strong>{industry.name}</strong>
                  <span>{industry.description}</span>
                </span>
                <span className="job-industry-arrow" aria-hidden="true">↗</span>
              </Link>
            ))}
          </div>
        </section>

        <p className="job-source-note">
          Listings are shown only after a data source is connected, or an administrator approves them. Chemstem does not fabricate job-search results.
        </p>
      </main>
      <SiteFooter />
    </>
  );
}
