import "server-only";
import { Resend } from "resend";
import { getSiteOrigin } from "@/lib/site-url";

export type ChemistRequestEmailDetails = {
  requestId: string;
  fullName: string;
  username: string;
  email: string;
  motivation: string;
};

function getResend(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  return apiKey ? new Resend(apiKey) : null;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export async function sendNewRequestEmail(details: ChemistRequestEmailDetails): Promise<void> {
  const resend = getResend();
  if (!resend) return;

  const adminEmail =
    process.env.ADMIN_NOTIFICATION_EMAIL || "destinyosik2007@gmail.com";
  const siteUrl = getSiteOrigin();
  const { error } = await resend.emails.send({
    from: "Chemstem <onboarding@resend.dev>",
    to: adminEmail,
    subject: `New Chemstem request: ${details.fullName}`,
    html: `
      <h2>New Chemist Request</h2>
      <p><strong>Full name:</strong> ${escapeHtml(details.fullName)}</p>
      <p><strong>Username:</strong> ${escapeHtml(details.username)}</p>
      <p><strong>Email:</strong> ${escapeHtml(details.email)}</p>
      <p><strong>Reason they want to be a chemist:</strong> ${escapeHtml(details.motivation)}</p>
      <p><strong>Request ID:</strong> ${escapeHtml(details.requestId)}</p>
      <p><a href="${siteUrl}/admin">Open the admin dashboard to review this request</a></p>
    `,
  });
  if (error) throw new Error(error.message);
}

export async function sendRequestDecisionEmail(
  details: ChemistRequestEmailDetails,
  decision: "approved" | "rejected",
  note?: string | null,
): Promise<void> {
  const resend = getResend();
  if (!resend) return;

  const siteUrl = getSiteOrigin();
  const { error } = await resend.emails.send({
    from: "Chemstem <onboarding@resend.dev>",
    to: details.email,
    subject: `Your Chemstem request was ${decision}`,
    html: `
      <h2>Chemstem request ${decision}</h2>
      <p>Hello ${escapeHtml(details.fullName)},</p>
      <p>Your request with ID ${escapeHtml(details.requestId)} has been <strong>${decision}</strong>.</p>
      ${note ? `<p><strong>Administrator note:</strong> ${escapeHtml(note)}</p>` : ""}
      ${decision === "approved" ? `<p><a href="${siteUrl}/account">Open your dashboard</a></p>` : ""}
    `,
  });
  if (error) throw new Error(error.message);
}
