import "server-only";

export type Job = {
  id: string;
  title: string;
  company: string;
  location: string;
  snippet: string;
  url: string;
  salary?: string;
  postedAt?: string;
};

export async function searchNigeriaJobs(keywords: string, page = 1): Promise<Job[]> {
  const key = process.env.JOOBLE_API_KEY;
  if (!key) return [];

  try {
    const res = await fetch(`https://jooble.org/api/${key}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keywords, location: "Nigeria", page: String(page) }),
      next: { revalidate: 3600 },
    });
    if (!res.ok) {
      console.error("Jooble request failed:", res.status);
      return [];
    }
    const data = await res.json();
    return (data.jobs ?? []).map((j: any) => ({
      id: String(j.id ?? j.link),
      title: j.title ?? "",
      company: j.company ?? "",
      location: j.location ?? "Nigeria",
      snippet: String(j.snippet ?? "").replace(/<[^>]*>/g, ""),
      url: j.link ?? "",
      salary: j.salary || undefined,
      postedAt: j.updated || undefined,
    }));
  } catch (error) {
    console.error("Jooble error:", error instanceof Error ? error.message : error);
    return [];
  }
}