"use server";

import { revalidatePath } from "next/cache";
import { requireActiveUser } from "@/lib/auth";
import { chemistryIndustries } from "@/lib/jobs/industries";
import { createServerClient } from "@/lib/supabase/server";

export type JobFormState = {
  error?: string;
  message?: string;
};

function parseSkills(formData: FormData): { skills?: string[]; error?: string } {
  const skills = String(formData.get("technical_skills") ?? "")
    .split(",")
    .map((skill) => skill.trim())
    .filter(Boolean);
  if (skills.length > 30 || skills.some((skill) => skill.length > 120)) {
    return { error: "Provide up to 30 technical skills, each 120 characters or fewer." };
  }
  return { skills: [...new Set(skills)] };
}

function validateHttpsUrl(value: string): string {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error("The application link must be a valid HTTPS URL.");
  }
  if (url.protocol !== "https:") {
    throw new Error("The application link must use HTTPS.");
  }
  return url.toString();
}

function parseDeadline(value: string): string | null {
  if (!value) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error("Enter a valid application deadline.");
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new Error("Enter a valid application deadline.");
  }
  return value;
}

export async function submitChemistryJob(
  _previousState: JobFormState,
  formData: FormData,
): Promise<JobFormState> {
  const industrySlug = String(formData.get("industry_slug") ?? "");
  if (!chemistryIndustries.some((industry) => industry.slug === industrySlug)) {
    return { error: "Select one of the chemistry industries." };
  }

  await requireActiveUser(`/jobs/industry/${industrySlug}`);
  const title = String(formData.get("title") ?? "").trim();
  const companyName = String(formData.get("company_name") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  if (!title || !companyName || !location || !description) {
    return { error: "Complete the job title, company, location, and description." };
  }
  if (title.length > 180 || companyName.length > 180 || location.length > 180 || description.length > 5000) {
    return { error: "One or more fields exceed their allowed length." };
  }

  const applicationUrl = String(formData.get("application_url") ?? "").trim();
  if (applicationUrl.length > 2048) {
    return { error: "The application link must be 2048 characters or fewer." };
  }
  let validatedUrl: string;
  try {
    validatedUrl = validateHttpsUrl(applicationUrl);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "The application link is invalid." };
  }

  const experience = String(formData.get("experience") ?? "").trim();
  const qualifications = String(formData.get("qualifications") ?? "").trim();
  const salaryText = String(formData.get("salary_text") ?? "").trim();
  if (experience.length > 1000 || qualifications.length > 2000 || salaryText.length > 120) {
    return { error: "One or more optional fields exceed their allowed length." };
  }

  let deadline: string | null;
  try {
    deadline = parseDeadline(String(formData.get("application_deadline") ?? ""));
  } catch (error) {
    return { error: error instanceof Error ? error.message : "The deadline is invalid." };
  }

  const parsedSkills = parseSkills(formData);
  if (parsedSkills.error) return { error: parsedSkills.error };

  const supabase = await createServerClient();
  const { error } = await supabase.rpc("submit_chemistry_job", {
    p_industry_slug: industrySlug,
    p_title: title,
    p_company_name: companyName,
    p_location: location,
    p_description: description,
    p_qualifications: qualifications,
    p_experience: experience,
    p_technical_skills: parsedSkills.skills ?? [],
    p_application_deadline: deadline,
    p_salary_text: salaryText || null,
    p_application_url: validatedUrl,
  });
  if (error) {
    console.error("Chemistry job submission failed:", error.message);
    return { error: "Unable to submit this job for review right now. Please try again later." };
  }

  revalidatePath("/admin/jobs");
  return { message: "Thanks. Your job listing was submitted and will appear after admin approval." };
}
