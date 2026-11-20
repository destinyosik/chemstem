import Link from "next/link";
import { notFound } from "next/navigation";
import { reviewChemistRequest, setChemistAccess } from "@/app/actions/admin";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { isAdminUser, requireActiveUser } from "@/lib/auth";
import { createReadOnlyServerClient } from "@/lib/supabase/server";

type AdminSearchParams = {
  q?: string;
  status?: string;
  from?: string;
  through?: string;
  page?: string;
};

type AdminPageProps = { searchParams: Promise<AdminSearchParams> };

const PAGE_SIZE = 50;

type ChemistApplication = {
  user_id: string;
  full_name: string;
  email: string;
  university: string;
  motivation: string;
  access_status: "active" | "suspended";
  created_at: string;
  username: string;
  request_status: "pending" | "approved" | "rejected";
};

function validDate(value?: string): string | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value
    ? null
    : value;
}

function validPage(value?: string): number {
  const page = Number(value);
  return Number.isSafeInteger(page) && page > 0 && page <= 1_000_000 ? page : 1;
}

function getPageHref(page: number, params: AdminSearchParams): string {
  const query = new URLSearchParams();
  const filters = {
    q: params.q?.trim().slice(0, 160),
    status: params.status === "active" || params.status === "suspended" ? params.status : undefined,
    from: validDate(params.from) ?? undefined,
    through: validDate(params.through) ?? undefined,
  };
  for (const [key, value] of Object.entries(filters)) {
    if (value) query.set(key, value);
  }
  query.set("page", String(page));
  return `/admin?${query.toString()}`;
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const [user, params] = await Promise.all([
    requireActiveUser("/admin"),
    searchParams,
  ]);

  if (!isAdminUser(user)) {
    notFound();
  }

  const search = params.q?.trim().slice(0, 160) || null;
  const status =
    params.status === "active" || params.status === "suspended"
      ? params.status
      : null;
  const registeredAfter = validDate(params.from);
  const registeredBefore = validDate(params.through);
  const page = validPage(params.page);
  const invalidDateFilter =
    (Boolean(params.from) && !registeredAfter) ||
    (Boolean(params.through) && !registeredBefore);
  const invalidDateRange =
    registeredAfter !== null &&
    registeredBefore !== null &&
    registeredAfter > registeredBefore;
  const filterError = invalidDateFilter
    ? "Enter valid registration dates to filter applications."
    : invalidDateRange
      ? "The registration start date must be on or before the end date."
      : null;
  let applications: ChemistApplication[] = [];
  let hasMore = false;

  if (!filterError) {
    const supabase = await createReadOnlyServerClient();
    const { data, error } = await supabase.rpc("admin_search_chemist_applications", {
      p_search: search,
      p_access_status: status,
      p_registered_after: registeredAfter,
      p_registered_before: registeredBefore,
      p_limit: PAGE_SIZE + 1,
      p_offset: (page - 1) * PAGE_SIZE,
    });

    if (error) {
      throw new Error(`Unable to load chemist applications: ${error.message}`);
    }

    const rows: ChemistApplication[] = data ?? [];
    hasMore = rows.length > PAGE_SIZE;
    applications = rows.slice(0, PAGE_SIZE);
  }

  return (
    <>
      <SiteHeader user={user} />
      <main className="content-page page-shell admin-page">
        <header className="admin-heading">
          <span className="content-kicker">Private administration</span>
          <h1>Chemist applications</h1>
          <p>Personal application data is visible only to authorized chemstem administrators.</p>
          <Link className="content-back" href="/admin/jobs">Manage chemistry job engine →</Link>
          <Link className="content-back" href="/admin/premium">Manage Premium platform →</Link>
        </header>

        <form className="admin-filters" action="/admin" method="get">
          <label>
            Search applications
            <input
              defaultValue={params.q}
              maxLength={160}
              name="q"
              placeholder="Name, email, university, or response"
              type="search"
            />
          </label>
          <label>
            Access status
            <select defaultValue={status ?? ""} name="status">
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
          </label>
          <label>
            Registered from
            <input defaultValue={registeredAfter ?? ""} name="from" type="date" />
          </label>
          <label>
            Registered through
            <input defaultValue={registeredBefore ?? ""} name="through" type="date" />
          </label>
          <button className="button button-dark" type="submit">Apply filters</button>
        </form>

        {filterError && <p className="form-message form-error" role="alert">{filterError}</p>}
        <p className="admin-result-count">
          Showing {applications.length} {applications.length === 1 ? "application" : "applications"}
          {!filterError && (hasMore || page > 1) ? ` on page ${page}` : ""}.
        </p>

        {filterError ? null : applications.length === 0 ? (
          <div className="coming-soon">No applications match these filters.</div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th scope="col">Chemist</th>
                  <th scope="col">University</th>
                  <th scope="col">Why they became a chemist</th>
                  <th scope="col">Registered</th>
                  <th scope="col">Access</th>
                  <th scope="col">Manage</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((application) => (
                  <tr key={application.user_id}>
                    <td>
                      <strong>{application.full_name}</strong>
                      <span className="admin-email">@{application.username}</span>
                      <a className="admin-email" href={`mailto:${application.email}`}>{application.email}</a>
                    </td>
                    <td>{application.university}</td>
                    <td className="admin-motivation">{application.motivation || "No response provided"}</td>
                    <td>{new Date(application.created_at).toLocaleDateString("en", { dateStyle: "medium", timeZone: "UTC" })}</td>
                    <td>
                      <span className={`admin-status ${application.access_status}`}>
                        {application.access_status}
                      </span>
                    </td>
                    <td>
                      {application.request_status === "pending" ? (
                        <div className="admin-request-actions">
                          <form action={reviewChemistRequest}>
                            <input name="user_id" type="hidden" value={application.user_id} />
                            <button className="admin-access-button" name="decision" type="submit" value="approved">Approve</button>
                          </form>
                          <form action={reviewChemistRequest}>
                            <input name="user_id" type="hidden" value={application.user_id} />
                            <button className="admin-access-button" name="decision" type="submit" value="rejected">Reject</button>
                          </form>
                        </div>
                      ) : application.request_status === "rejected" ? (
                        <span className="admin-status suspended">Rejected</span>
                      ) : application.user_id === user.id ? (
                        <span className="admin-current-account">Your account</span>
                      ) : (
                        <form action={setChemistAccess}>
                          <input name="user_id" type="hidden" value={application.user_id} />
                          <button
                            className="admin-access-button"
                            name="access_status"
                            type="submit"
                            value={application.access_status === "active" ? "suspended" : "active"}
                          >
                            {application.access_status === "active" ? "Suspend access" : "Restore access"}
                          </button>
                        </form>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!filterError && (page > 1 || hasMore) && (
          <nav className="admin-pagination" aria-label="Application pages">
            {page > 1
              ? <Link href={getPageHref(page - 1, params)}>Previous page</Link>
              : <span />}
            <span>Page {page}</span>
            {hasMore
              ? <Link href={getPageHref(page + 1, params)}>Next page</Link>
              : <span />}
          </nav>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
