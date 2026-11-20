"use server";

import { revalidatePath } from "next/cache";
import { isAdminUser, requireActiveUser } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase/server";
import { sendRequestDecisionEmail } from "@/lib/email";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function setChemistAccess(formData: FormData): Promise<void> {
  const user = await requireActiveUser("/admin");

  if (!isAdminUser(user)) {
    throw new Error("Administrator access is required to manage accounts.");
  }

  const userId = String(formData.get("user_id") ?? "");
  const accessStatus = String(formData.get("access_status") ?? "");

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(userId)) {
    throw new Error("The selected account ID is invalid.");
  }

  if (accessStatus !== "active" && accessStatus !== "suspended") {
    throw new Error("The selected access status is invalid.");
  }

  const supabase = await createServerClient();
  const { error } = await supabase.rpc("admin_set_chemist_access", {
    p_user_id: userId,
    p_access_status: accessStatus,
  });

  if (error) {
    throw new Error(`Unable to update account access: ${error.message}`);
  }

  revalidatePath("/admin");
}

export async function reviewChemistRequest(formData: FormData): Promise<void> {
  const user = await requireActiveUser("/admin");
  if (!isAdminUser(user)) {
    throw new Error("Administrator access is required to review requests.");
  }

  const userId = String(formData.get("user_id") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const note = String(formData.get("note") ?? "").trim().slice(0, 500);

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(userId)) {
    throw new Error("The selected request ID is invalid.");
  }
  if (decision !== "approved" && decision !== "rejected") {
    throw new Error("The selected decision is invalid.");
  }

  const supabase = await createServerClient();
  const { data: application, error: applicationError } = await supabase
    .from("chemist_applications")
    .select("user_id, full_name, email, username, motivation")
    .eq("user_id", userId)
    .maybeSingle();
  if (applicationError) throw new Error(applicationError.message);
  if (!application) throw new Error("Chemist request not found.");

  const { error } = await supabase.rpc("admin_review_chemist_request", {
    p_user_id: userId,
    p_decision: decision,
    p_note: note || null,
  });
  if (error) throw new Error(`Unable to review request: ${error.message}`);

  try {
    const admin = createSupabaseAdminClient();
    const { data: notification } = await admin
      .from("request_notifications")
      .insert({
        request_user_id: userId,
        kind: decision,
        recipient: application.email,
      })
      .select("id")
      .maybeSingle();

    if (notification) {
      try {
        await sendRequestDecisionEmail(
          {
            requestId: userId,
            fullName: application.full_name,
            username: application.username,
            email: application.email,
            motivation: application.motivation,
          },
          decision,
          note,
        );
        await admin
          .from("request_notifications")
          .update({ sent_at: new Date().toISOString() })
          .eq("id", notification.id);
      } catch (emailError) {
        await admin
          .from("request_notifications")
          .update({ error: emailError instanceof Error ? emailError.message : "Email delivery failed" })
          .eq("id", notification.id);
      }
    }
  } catch {
    // Request status is persisted even if notification delivery fails.
  }

  revalidatePath("/admin");
  revalidatePath("/account");
}
