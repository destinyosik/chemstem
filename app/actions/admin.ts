"use server";

import { revalidatePath } from "next/cache";
import { isAdminUser, requireActiveUser } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase/server";

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
