"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isAdminUser, requireActiveUser } from "@/lib/auth";
import { updateChemistryJobs } from "@/lib/jobs/sync";
import { chemistryIndustries } from "@/lib/jobs/industries";
import { createServerClient } from "@/lib/supabase/server";

async function requireAdministrator() {
  const user = await requireActiveUser("/admin/jobs");
  if (!isAdminUser(user)) {
    throw new Error("Administrator access is required.");
  }
}

function requiredText(formData: FormData, name: string, label: string, maxLength: number): string {
  const value = String(formData.get(name) ?? "").trim();
  if (!value || value.length > maxLength) {
    throw new Error(`${label} is required and must be ${maxLength} characters or fewer.`);
  }
  return value;
}

function parseSkills(formData: FormData): string[] {
  const skills = String(formData.get("technical_skills") ?? "")
    .split(",")
    .map((skill) => skill.trim())
    .filter(Boolean);
  if (skills.length > 30 || skills.some((skill) => skill.length > 120)) {
    throw new Error("Provide up to 30 technical skills, each 120 characters or fewer.");
  }
  return [...new Set(skills)];
}

export async function reviewChemistryJob(formData: FormData): Promise<void> {
  await requireAdministrator();
  const jobId = String(formData.get("job_id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(jobId)) {
    throw new Error("The selected job ID is invalid.");
  }
  if (!["approved", "rejected", "closed"].includes(status)) {
    throw new Error("The selected job review status is invalid.");
  }

  const supabase = await createServerClient();
  const { error } = await supabase.rpc("admin_review_chemistry_job", {
    p_job_id: jobId,
    p_status: status,
  });
  if (error) {
    throw new Error(`Unable to update job approval: ${error.message}`);
  }

  revalidatePath("/admin/jobs");
  revalidatePath("/jobs");
  revalidatePath("/jobs/listings");
  revalidatePath("/jobs/search");
}

export async function createAdminChemistryJob(formData: FormData): Promise<void> {
  await requireAdministrator();
  const industrySlug = String(formData.get("industry_slug") ?? "");
  if (!chemistryIndustries.some((industry) => industry.slug === industrySlug)) {
    throw new Error("Choose a valid chemistry industry.");
  }

  const applicationUrl = new URL(requiredText(formData, "application_url", "Application link", 2048));
  if (applicationUrl.protocol !== "https:") {
    throw new Error("The application link must use HTTPS.");
  }
  const deadlineValue = String(formData.get("application_deadline") ?? "").trim();
  const deadline = deadlineValue || null;
  if (deadline && !/^\d{4}-\d{2}-\d{2}$/.test(deadline)) {
    throw new Error("Enter a valid application deadline.");
  }

  const supabase = await createServerClient();
  const { error } = await supabase.rpc("admin_create_chemistry_job", {
    p_industry_slug: industrySlug,
    p_title: requiredText(formData, "title", "Job title", 180),
    p_company_name: requiredText(formData, "company_name", "Company name", 180),
    p_location: requiredText(formData, "location", "Location", 180),
    p_description: requiredText(formData, "description", "Description", 5000),
    p_qualifications: String(formData.get("qualifications") ?? "").trim().slice(0, 2000),
    p_experience: String(formData.get("experience") ?? "").trim().slice(0, 1000),
    p_technical_skills: parseSkills(formData),
    p_application_deadline: deadline,
    p_salary_text: String(formData.get("salary_text") ?? "").trim().slice(0, 120) || null,
    p_application_url: applicationUrl.toString(),
  });
  if (error) {
    throw new Error(`Unable to add chemistry job: ${error.message}`);
  }

  revalidatePath("/admin/jobs");
  revalidatePath("/jobs");
  revalidatePath("/jobs/listings");
}

export async function triggerManualJobUpdate(): Promise<void> {
  await requireAdministrator();
  const result = await updateChemistryJobs("admin");
  revalidatePath("/admin/jobs");
  revalidatePath("/jobs");
  revalidatePath("/jobs/listings");
  revalidatePath("/jobs/search");
  redirect(`/admin/jobs?update=${encodeURIComponent(result.status)}`);
}

export async function updateChemistryIndustry(formData: FormData): Promise<void> {
  await requireAdministrator();
  const slug = String(formData.get("slug") ?? "");
  if (!chemistryIndustries.some((industry) => industry.slug === slug)) {
    throw new Error("The selected chemistry industry is invalid.");
  }
  const name = requiredText(formData, "name", "Industry name", 120);
  const description = requiredText(formData, "description", "Industry description", 500);
  const active = formData.get("active") === "on";

  const supabase = await createServerClient();
  const { error } = await supabase.rpc("admin_update_chemistry_industry", {
    p_slug: slug,
    p_name: name,
    p_description: description,
    p_active: active,
  });
  if (error) {
    throw new Error(`Unable to update chemistry industry: ${error.message}`);
  }

  revalidatePath("/admin/jobs");
  revalidatePath("/jobs");
}
