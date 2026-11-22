import { NextResponse, type NextRequest } from "next/server";
import { getSafeReturnPath } from "@/lib/navigation";
import { getSiteOrigin } from "@/lib/site-url";
import { getSupabaseCredentials } from "@/lib/supabase/env";
import { createServerClient } from "@/lib/supabase/server";

function getErrorRedirect(request: NextRequest, path: string, nextPath: string) {
  const destination = new URL(path, request.url);
  destination.searchParams.set("error", "google");
  if (nextPath) destination.searchParams.set("next", nextPath);
  return NextResponse.redirect(destination);
}

export async function GET(request: NextRequest) {
  const nextPath = getSafeReturnPath(request.nextUrl.searchParams.get("next"), "/account");
  const returnPage =
    request.nextUrl.searchParams.get("from") === "register" ? "/register" : "/login";

  if (!getSupabaseCredentials()) {
    return getErrorRedirect(request, returnPage, nextPath);
  }

  let redirectTo: string;
  try {
    const callback = new URL("/auth/callback", getSiteOrigin());
    callback.searchParams.set("next", nextPath);
    redirectTo = callback.toString();
  } catch (error) {
    console.error(
      "Unable to build the Google OAuth callback:",
      error instanceof Error ? error.message : "Invalid site URL configuration.",
    );
    return getErrorRedirect(request, returnPage, nextPath);
  }

  const supabase = await createServerClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo },
  });

  if (error || !data.url) {
    console.error("Unable to start Google OAuth:", error?.message ?? "No provider URL returned.");
    return getErrorRedirect(request, returnPage, nextPath);
  }

  return NextResponse.redirect(data.url);
}
