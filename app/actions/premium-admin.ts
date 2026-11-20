"use server";

import { revalidatePath } from "next/cache";
import { isAdminUser, requireActiveUser } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase/server";

async function requireAdministrator() {
  const user = await requireActiveUser("/admin/premium");
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

function validateHttpsUrl(value: string, label: string): string {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${label} must be a valid HTTPS URL.`);
  }
  if (url.protocol !== "https:") {
    throw new Error(`${label} must use HTTPS.`);
  }
  return url.toString();
}

function lines(formData: FormData, name: string, label: string): string[] {
  const values = String(formData.get(name) ?? "")
    .split(/\r?\n/)
    .map((value) => value.trim())
    .filter(Boolean);
  if (values.length > 30 || values.some((value) => value.length > 500)) {
    throw new Error(`${label} can contain up to 30 lines, each no longer than 500 characters.`);
  }
  return values;
}

export async function managePremiumAccess(formData: FormData): Promise<void> {
  await requireAdministrator();
  const userId = String(formData.get("user_id") ?? "");
  const action = String(formData.get("action") ?? "");
  const days = Number(formData.get("days"));
  const reason = String(formData.get("reason") ?? "").trim();

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(userId)) {
    throw new Error("The selected account ID is invalid.");
  }
  if (action !== "grant" && action !== "revoke") {
    throw new Error("The selected membership action is invalid.");
  }
  if (action === "grant" && (!Number.isInteger(days) || days < 1 || days > 3650 || !reason)) {
    throw new Error("Enter a manual access duration from 1 to 3650 days and a reason.");
  }

  const supabase = await createServerClient();
  const { error } = await supabase.rpc("admin_manage_premium_access", {
    p_user_id: userId,
    p_action: action,
    p_days: action === "grant" ? days : null,
    p_reason: action === "grant" ? reason : null,
  });
  if (error) {
    throw new Error(`Unable to manage Premium access: ${error.message}`);
  }

  revalidatePath("/admin/premium");
  revalidatePath("/advanced");
}

export async function addPremiumCourse(formData: FormData): Promise<void> {
  await requireAdministrator();
  const rawPrice = String(formData.get("price_naira") ?? "").trim();
  if (!/^\d+(?:\.\d{1,2})?$/.test(rawPrice)) {
    throw new Error("Course price must be entered in naira with no more than two decimal places.");
  }
  const priceNaira = Number(rawPrice);
  const amountKobo = Math.round(priceNaira * 100);
  if (!Number.isFinite(priceNaira) || !Number.isSafeInteger(amountKobo) || amountKobo < 100) {
    throw new Error("Course price must be at least ₦1.00.");
  }

  const supabase = await createServerClient();
  const { error } = await supabase.rpc("admin_create_premium_course", {
    p_title: requiredText(formData, "title", "Course title", 160),
    p_description: requiredText(formData, "description", "Course description", 4000),
    p_instructor: requiredText(formData, "instructor", "Instructor", 160),
    p_amount_kobo: amountKobo,
    p_duration: requiredText(formData, "duration", "Course duration", 100),
    p_learning_outcomes: lines(formData, "learning_outcomes", "Learning outcomes"),
    p_materials: lines(formData, "materials", "Course materials"),
    p_enrollment_url: validateHttpsUrl(
      requiredText(formData, "enrollment_url", "Enrolment link", 2048),
      "Enrolment link",
    ),
  });
  if (error) {
    throw new Error(`Unable to add course: ${error.message}`);
  }

  revalidatePath("/admin/premium");
  revalidatePath("/advanced");
}

export async function addAdvancedOpportunity(formData: FormData): Promise<void> {
  await requireAdministrator();
  const closingValue = String(formData.get("closing_at") ?? "").trim();
  const closingAt = closingValue ? new Date(closingValue) : null;
  if (closingAt && (Number.isNaN(closingAt.getTime()) || closingAt.getTime() <= Date.now())) {
    throw new Error("The closing date must be a valid future date.");
  }

  const supabase = await createServerClient();
  const { error } = await supabase.rpc("admin_create_advanced_opportunity", {
    p_title: requiredText(formData, "title", "Job title", 180),
    p_organization: requiredText(formData, "organization", "Organization", 180),
    p_location: requiredText(formData, "location", "Location", 180),
    p_employment_type: requiredText(formData, "employment_type", "Employment type", 80),
    p_description: requiredText(formData, "description", "Description", 4000),
    p_application_url: validateHttpsUrl(
      requiredText(formData, "application_url", "Application link", 2048),
      "Application link",
    ),
    p_closing_at: closingAt?.toISOString() ?? null,
  });
  if (error) {
    throw new Error(`Unable to add opportunity: ${error.message}`);
  }

  revalidatePath("/admin/premium");
  revalidatePath("/advanced");
}

export async function updateCreatorGuidanceStatus(formData: FormData): Promise<void> {
  await requireAdministrator();
  const requestId = String(formData.get("request_id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestId)) {
    throw new Error("The selected guidance request ID is invalid.");
  }
  if (!["new", "in_progress", "closed"].includes(status)) {
    throw new Error("The selected guidance request status is invalid.");
  }

  const supabase = await createServerClient();
  const { error } = await supabase.rpc("admin_update_creator_guidance_status", {
    p_request_id: requestId,
    p_status: status,
  });
  if (error) {
    throw new Error(`Unable to update guidance request: ${error.message}`);
  }

  revalidatePath("/admin/premium");
}
