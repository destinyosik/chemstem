import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { chemistryIndustries, isChemistryCareerSearch } from "./industries";

type AdzunaJob = {
  id?: string | number;
  title?: string;
  description?: string;
  redirect_url?: string;
  created?: string;
  salary_min?: number;
  salary_max?: number;
  company?: { display_name?: string };
  location?: { display_name?: string };
  category?: { label?: string; tag?: string };
  contract_time?: string;
  contract_type?: string;
};

type AdzunaResponse = { results?: AdzunaJob[] };

const adzunaCurrencies: Record<string, string> = {
  au: "AUD",
  at: "EUR",
  br: "BRL",
  ca: "CAD",
  de: "EUR",
  es: "EUR",
  fr: "EUR",
  gb: "GBP",
  in: "INR",
  it: "EUR",
  nl: "EUR",
  nz: "NZD",
  pl: "PLN",
  sg: "SGD",
  us: "USD",
  za: "ZAR",
};

type ChemistryJobRow = {
  industry_slug: string;
  title: string;
  company_name: string;
  location: string;
  description: string;
  qualifications: string;
  experience: string;
  technical_skills: string[];
  application_deadline: null;
  salary_text: string | null;
  application_url: string;
  source_name: string;
  source_job_id: string;
  source_url: string;
  discovered_at: string;
  expires_at: string;
  status: "approved";
};

export type JobUpdateResult = {
  status: "success" | "no_source_configured" | "failed";
  jobsFound: number;
  jobsAdded: number;
  jobsUpdated: number;
  jobsExpired: number;
  message: string;
};

export type AdzunaSearchJob = Omit<ChemistryJobRow, "status"> & {
  id: string;
  industry_name: string;
};

export type AdzunaSearchResult = {
  status: "success" | "no_source_configured" | "failed";
  jobs: AdzunaSearchJob[];
  message: string;
};

function isChemistryRelated(job: AdzunaJob): boolean {
  const title = job.title ?? "";
  const description = job.description ?? "";
  return /\b(chemistry|chemist|chemical|laboratory|laboratories|lab technician|analytical|formulation|pharmaceutical|polymer|quality control|quality assurance|water treatment|petroleum|agrochemical|food scientist|materials scientist)\b/i.test(
    `${title} ${description}`,
  );
}

function categorize(job: AdzunaJob, fallbackSlug: string): string {
  const text = `${job.title ?? ""} ${job.description ?? ""} ${job.category?.label ?? ""} ${job.category?.tag ?? ""}`.toLowerCase();
  const scores = chemistryIndustries.map((industry) => ({
    slug: industry.slug,
    score: industry.keywords.reduce(
      (score, keyword) => score + (text.includes(keyword.toLowerCase()) ? 1 : 0),
      0,
    ),
  }));
  scores.sort((a, b) => b.score - a.score);
  return scores[0]?.score ? scores[0].slug : fallbackSlug;
}

function salaryLabel(job: AdzunaJob, countryCode: string): string | null {
  const min = job.salary_min;
  const max = job.salary_max;
  const currency = adzunaCurrencies[countryCode];
  if ((!Number.isFinite(min) && !Number.isFinite(max)) || !currency) return null;
  const formatter = new Intl.NumberFormat("en", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  });
  if (typeof min === "number" && typeof max === "number") {
    return `${formatter.format(min)}–${formatter.format(max)} per year`;
  }
  return `${formatter.format((min ?? max) as number)} per year`;
}

function convertAdzunaJob(
  job: AdzunaJob,
  fallbackSlug: string,
  discoveredAt: string,
  countryCode: string,
  acceptChemistrySearchResult = false,
): ChemistryJobRow | null {
  const id = job.id === undefined ? "" : String(job.id);
  const title = job.title?.trim();
  let applicationUrl: string | null = null;
  if (job.redirect_url) {
    try {
      const url = new URL(job.redirect_url);
      if ((url.protocol === "https:" || url.protocol === "http:") && !url.username && !url.password) {
        applicationUrl = url.toString();
      }
    } catch {
      applicationUrl = null;
    }
  }
  const description = job.description?.trim();
  if (
    !id ||
    !title ||
    !description ||
    !applicationUrl ||
    (!acceptChemistrySearchResult && !isChemistryRelated(job))
  ) {
    return null;
  }

  return {
    industry_slug: categorize(job, fallbackSlug),
    title: title.slice(0, 180),
    company_name: (job.company?.display_name || "Not disclosed").slice(0, 180),
    location: (job.location?.display_name || "Not disclosed").slice(0, 180),
    description: description.slice(0, 5000),
    qualifications: "",
    experience: "",
    technical_skills: [],
    application_deadline: null,
    salary_text: salaryLabel(job, countryCode),
    application_url: applicationUrl,
    source_name: "adzuna",
    source_job_id: id,
    source_url: applicationUrl,
    discovered_at: discoveredAt,
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    status: "approved",
  };
}

async function fetchIndustryJobs(
  appId: string,
  appKey: string,
  countryCode: string,
  searchTerms: string,
  resultsPerPage = 50,
): Promise<AdzunaJob[]> {
  const url = new URL(`https://api.adzuna.com/v1/api/jobs/${countryCode}/search/1`);
  url.searchParams.set("app_id", appId);
  url.searchParams.set("app_key", appKey);
  url.searchParams.set("results_per_page", String(resultsPerPage));
  url.searchParams.set("what", searchTerms);
  url.searchParams.set("content-type", "application/json");

  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    cache: "no-store",
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) {
    throw new Error(`Adzuna returned HTTP ${response.status} for a chemistry-industry query.`);
  }
  const result = (await response.json()) as AdzunaResponse;
  return Array.isArray(result.results) ? result.results : [];
}

function getFallbackIndustrySlug(query: string): string {
  const normalizedQuery = query.toLowerCase();
  return chemistryIndustries.find((industry) =>
    industry.keywords.some((keyword) => normalizedQuery.includes(keyword.toLowerCase())),
  )?.slug ?? "laboratory-services";
}

export async function searchAdzunaChemistryJobs(
  query: string,
): Promise<AdzunaSearchResult> {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;
  const countryCode = process.env.ADZUNA_COUNTRY_CODE?.toLowerCase();
  if (!appId || !appKey || !countryCode || !/^[a-z]{2}$/.test(countryCode)) {
    return {
      status: "no_source_configured",
      jobs: [],
      message: "No live job search ran. Configure Adzuna credentials and a supported ADZUNA_COUNTRY_CODE.",
    };
  }
  if (!isChemistryCareerSearch(query)) {
    return {
      status: "success",
      jobs: [],
      message: "Search for a chemistry-related role to view live opportunities.",
    };
  }

  try {
    const results = await fetchIndustryJobs(appId, appKey, countryCode, query, 25);
    const discoveredAt = new Date().toISOString();
    const fallbackSlug = getFallbackIndustrySlug(query);
    const jobsById = new Map<string, AdzunaSearchJob>();
    for (const result of results) {
      const job = convertAdzunaJob(
        result,
        fallbackSlug,
        discoveredAt,
        countryCode,
        true,
      );
      if (!job) continue;

      jobsById.set(job.source_job_id, {
        ...job,
        id: `adzuna:${job.source_job_id}`,
        industry_name:
          chemistryIndustries.find((industry) => industry.slug === job.industry_slug)?.name
          ?? "Laboratory Services",
      });
    }

    return {
      status: "success",
      jobs: [...jobsById.values()],
      message: `Searched Adzuna for “${query}”.`,
    };
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown Adzuna error.";
    console.error("Live Adzuna chemistry job search failed:", detail);
    return {
      status: "failed",
      jobs: [],
      message: "The live job provider could not be reached. Please try again later.",
    };
  }
}

async function writeLog(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  triggeredBy: "cron" | "admin",
  result: JobUpdateResult,
): Promise<void> {
  const { error } = await supabase.from("chemistry_job_update_logs").insert({
    source_name: "adzuna",
    status: result.status,
    triggered_by: triggeredBy,
    jobs_found: result.jobsFound,
    jobs_added: result.jobsAdded,
    jobs_updated: result.jobsUpdated,
    jobs_expired: result.jobsExpired,
    message: result.message.slice(0, 1000),
  });
  if (error) {
    throw new Error(`Unable to record job update log: ${error.message}`);
  }
}

export async function updateChemistryJobs(
  triggeredBy: "cron" | "admin",
): Promise<JobUpdateResult> {
  const supabase = createSupabaseAdminClient();
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;
  const countryCode = process.env.ADZUNA_COUNTRY_CODE?.toLowerCase();
  if (!appId || !appKey || !countryCode || !/^[a-z]{2}$/.test(countryCode)) {
    const result: JobUpdateResult = {
      status: "no_source_configured",
      jobsFound: 0,
      jobsAdded: 0,
      jobsUpdated: 0,
      jobsExpired: 0,
      message: "No job-source search ran: configure Adzuna credentials and a valid two-letter ADZUNA_COUNTRY_CODE.",
    };
    await writeLog(supabase, triggeredBy, result);
    return result;
  }

  try {
    const discoveredAt = new Date().toISOString();
    const fetched: Array<{ job: AdzunaJob; fallbackSlug: string }> = [];
    for (let offset = 0; offset < chemistryIndustries.length; offset += 4) {
      const batch = chemistryIndustries.slice(offset, offset + 4);
      const results = await Promise.all(
        batch.map((industry) =>
          fetchIndustryJobs(appId, appKey, countryCode, industry.searchTerms),
        ),
      );
      for (let index = 0; index < batch.length; index += 1) {
        fetched.push(...results[index].map((job) => ({ job, fallbackSlug: batch[index].slug })));
      }
    }

    const unique = new Map<string, { job: AdzunaJob; fallbackSlug: string }>();
    for (const entry of fetched) {
      if (entry.job.id !== undefined) unique.set(String(entry.job.id), entry);
    }

    const sourceIds = [...unique.keys()];
    const existing = new Map<string, { discovered_at: string; status: string }>();
    for (let offset = 0; offset < sourceIds.length; offset += 100) {
      const batch = sourceIds.slice(offset, offset + 100);
      const { data, error } = await supabase
        .from("chemistry_jobs")
        .select("source_job_id,discovered_at,status")
        .eq("source_name", "adzuna")
        .in("source_job_id", batch);
      if (error) throw new Error(`Unable to check imported job duplicates: ${error.message}`);
      for (const row of data ?? []) {
        if (row.source_job_id) {
          existing.set(row.source_job_id, { discovered_at: row.discovered_at, status: row.status });
        }
      }
    }

    const rows = [...unique.entries()]
      .map(([id, entry]) => {
        const row = convertAdzunaJob(entry.job, entry.fallbackSlug, discoveredAt, countryCode);
        const previous = existing.get(id);
        if (!row || previous?.status === "rejected" || previous?.status === "closed") return null;
        if (previous) row.discovered_at = previous.discovered_at;
        return row;
      })
      .filter((row): row is ChemistryJobRow => row !== null);

    let jobsAdded = 0;
    let jobsUpdated = 0;
    for (let offset = 0; offset < rows.length; offset += 100) {
      const batch = rows.slice(offset, offset + 100);
      const { data, error } = await supabase
        .from("chemistry_jobs")
        .upsert(batch, { onConflict: "source_name,source_job_id" })
        .select("id");
      if (error) throw new Error(`Unable to save imported jobs: ${error.message}`);
      for (const row of batch) {
        if (existing.has(row.source_job_id)) jobsUpdated += 1;
        else jobsAdded += 1;
      }
      if (!data) throw new Error("Supabase did not confirm imported job writes.");
    }

    const { data: expiredRows, error: expirationError } = await supabase
      .from("chemistry_jobs")
      .update({ status: "expired", updated_at: new Date().toISOString() })
      .eq("source_name", "adzuna")
      .eq("status", "approved")
      .lt("expires_at", new Date().toISOString())
      .select("id");
    if (expirationError) throw new Error(`Unable to expire old imported jobs: ${expirationError.message}`);

    const result: JobUpdateResult = {
      status: "success",
      jobsFound: fetched.length,
      jobsAdded,
      jobsUpdated,
      jobsExpired: expiredRows?.length ?? 0,
      message: `Queried Adzuna for ${chemistryIndustries.length} chemistry industries; retained original discovery dates for duplicates.`,
    };
    await writeLog(supabase, triggeredBy, result);
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : "The job source update failed unexpectedly.";
    const result: JobUpdateResult = {
      status: "failed",
      jobsFound: 0,
      jobsAdded: 0,
      jobsUpdated: 0,
      jobsExpired: 0,
      message,
    };
    await writeLog(supabase, triggeredBy, result);
    return result;
  }
}
