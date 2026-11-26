import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { chemistryIndustries, isChemistryCareerSearch } from "./industries";

const SOURCE = "jooble";

type JoobleJob = {
  id?: string | number;
  title?: string;
  location?: string;
  snippet?: string;
  salary?: string;
  type?: string;
  link?: string;
  company?: string;
  updated?: string;
};

type JoobleResponse = { jobs?: JoobleJob[] };

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

function cleanText(value: string | undefined): string {
  return (value ?? "")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isChemistryRelated(job: JoobleJob): boolean {
  return /\b(chemistry|chemist|chemical|laboratory|laboratories|lab technician|analytical|formulation|pharmaceutical|polymer|quality control|quality assurance|water treatment|petroleum|agrochemical|food scientist|materials scientist)\b/i.test(
    `${job.title ?? ""} ${job.snippet ?? ""}`,
  );
}

function categorize(job: JoobleJob, fallbackSlug: string): string {
  const text = `${job.title ?? ""} ${job.snippet ?? ""} ${job.type ?? ""}`.toLowerCase();
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

function convertJoobleJob(
  job: JoobleJob,
  fallbackSlug: string,
  discoveredAt: string,
  acceptAnySearchResult = false,
): ChemistryJobRow | null {
  const id = job.id !== undefined ? String(job.id) : job.link ?? "";
  const title = cleanText(job.title);
  const description = cleanText(job.snippet);
  let applicationUrl: string | null = null;
  if (job.link) {
    try {
      const url = new URL(job.link);
      if ((url.protocol === "https:" || url.protocol === "http:") && !url.username && !url.password) {
        applicationUrl = url.toString();
      }
    } catch {
      applicationUrl = null;
    }
  }
  if (!id || !title || !description || !applicationUrl) return null;
  if (!acceptAnySearchResult && !isChemistryRelated(job)) return null;

  return {
    industry_slug: categorize(job, fallbackSlug),
    title: title.slice(0, 180),
    company_name: (cleanText(job.company) || "Not disclosed").slice(0, 180),
    location: (cleanText(job.location) || "Nigeria").slice(0, 180),
    description: description.slice(0, 5000),
    qualifications: "",
    experience: "",
    technical_skills: [],
    application_deadline: null,
    salary_text: cleanText(job.salary) || null,
    application_url: applicationUrl,
    source_name: SOURCE,
    source_job_id: id.slice(0, 300),
    source_url: applicationUrl,
    discovered_at: discoveredAt,
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    status: "approved",
  };
}

async function fetchIndustryJobs(apiKey: string, searchTerms: string): Promise<JoobleJob[]> {
  const response = await fetch(`https://jooble.org/api/${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ keywords: searchTerms, location: "Nigeria", page: "1" }),
    cache: "no-store",
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) {
    throw new Error(`Jooble returned HTTP ${response.status} for a chemistry-industry query.`);
  }
  const result = (await response.json()) as JoobleResponse;
  return Array.isArray(result.jobs) ? result.jobs : [];
}

function getFallbackIndustrySlug(query: string): string {
  const normalizedQuery = query.toLowerCase();
  return (
    chemistryIndustries.find((industry) =>
      industry.keywords.some((keyword) => normalizedQuery.includes(keyword.toLowerCase())),
    )?.slug ?? "laboratory-services"
  );
}

export async function searchAdzunaChemistryJobs(query: string): Promise<AdzunaSearchResult> {
  const apiKey = process.env.JOOBLE_API_KEY;
  if (!apiKey) {
    return {
      status: "no_source_configured",
      jobs: [],
      message: "No live job search ran. Configure JOOBLE_API_KEY.",
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
    const results = await fetchIndustryJobs(apiKey, query);
    const discoveredAt = new Date().toISOString();
    const fallbackSlug = getFallbackIndustrySlug(query);
    const jobsById = new Map<string, AdzunaSearchJob>();
    for (const result of results) {
      const job = convertJoobleJob(result, fallbackSlug, discoveredAt, true);
      if (!job) continue;
      jobsById.set(job.source_job_id, {
        ...job,
        id: `${SOURCE}:${job.source_job_id}`,
        industry_name:
          chemistryIndustries.find((industry) => industry.slug === job.industry_slug)?.name ??
          "Laboratory Services",
      });
    }
    return {
      status: "success",
      jobs: [...jobsById.values()],
      message: `Searched Nigerian jobs for “${query}”.`,
    };
  } catch (error) {
    console.error(
      "Live Jooble chemistry job search failed:",
      error instanceof Error ? error.message : "Unknown error.",
    );
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
    source_name: SOURCE,
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
  const apiKey = process.env.JOOBLE_API_KEY;
  if (!apiKey) {
    const result: JobUpdateResult = {
      status: "no_source_configured",
      jobsFound: 0,
      jobsAdded: 0,
      jobsUpdated: 0,
      jobsExpired: 0,
      message: "No job-source search ran: configure JOOBLE_API_KEY.",
    };
    await writeLog(supabase, triggeredBy, result);
    return result;
  }

  try {
    const discoveredAt = new Date().toISOString();
    const fetched: Array<{ job: JoobleJob; fallbackSlug: string }> = [];
    for (let offset = 0; offset < chemistryIndustries.length; offset += 2) {
      const batch = chemistryIndustries.slice(offset, offset + 2);
      const results = await Promise.all(
        batch.map((industry) => fetchIndustryJobs(apiKey, industry.searchTerms)),
      );
      for (let index = 0; index < batch.length; index += 1) {
        fetched.push(...results[index].map((job) => ({ job, fallbackSlug: batch[index].slug })));
      }
    }

    const unique = new Map<string, { job: JoobleJob; fallbackSlug: string }>();
    for (const entry of fetched) {
      const id = entry.job.id !== undefined ? String(entry.job.id) : entry.job.link;
      if (id) unique.set(id.slice(0, 300), entry);
    }

    const sourceIds = [...unique.keys()];
    const existing = new Map<string, { discovered_at: string; status: string }>();
    for (let offset = 0; offset < sourceIds.length; offset += 100) {
      const batch = sourceIds.slice(offset, offset + 100);
      const { data, error } = await supabase
        .from("chemistry_jobs")
        .select("source_job_id,discovered_at,status")
        .eq("source_name", SOURCE)
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
        const row = convertJoobleJob(entry.job, entry.fallbackSlug, discoveredAt);
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
      .eq("source_name", SOURCE)
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
      message: `Queried Jooble for ${chemistryIndustries.length} chemistry industries in Nigeria; retained original discovery dates for duplicates.`,
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
