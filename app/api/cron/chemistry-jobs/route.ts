import { timingSafeEqual } from "node:crypto";
import { updateChemistryJobs } from "@/lib/jobs/sync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function isAuthorized(request: Request, secret: string): boolean {
  const authorization = request.headers.get("authorization") ?? "";
  const expected = Buffer.from(`Bearer ${secret}`);
  const received = Buffer.from(authorization);
  return received.length === expected.length && timingSafeEqual(received, expected);
}

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return Response.json({ error: "Job update cron is not configured." }, { status: 500 });
  }
  if (!isAuthorized(request, cronSecret)) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const result = await updateChemistryJobs("cron");
    return Response.json(result, {
      status: result.status === "failed" ? 502 : 200,
    });
  } catch (error) {
    console.error(
      "Chemistry job cron update failed:",
      error instanceof Error ? error.message : "Unexpected job update error.",
    );
    return Response.json({ error: "The job source update failed. See the admin update log." }, { status: 502 });
  }
}
