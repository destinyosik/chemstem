import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { signOut } from "@/app/actions/auth";
import { AtomIcon, SearchIcon } from "@/components/icons";

type SiteHeaderProps = {
  user: User | null;
};

export function SiteHeader({ user }: SiteHeaderProps) {
  return (
    <header className="site-header">
      <div className="header-inner">
        <Link className="brand" href="/" aria-label="chemstem home">
          <span className="brand-mark">
            <AtomIcon />
          </span>
          <span>chemstem</span>
        </Link>

        <nav className="desktop-nav" aria-label="Main navigation">
          <Link className="nav-link active" href="/">Home</Link>
          <Link className="nav-link" href="/about">About</Link>
        </nav>

        <div className="header-actions">
          {user ? (
            <>
              <Link className="job-search-link" href="/jobs" aria-label="Search chemistry jobs">
                <SearchIcon />
                <span>Find a job</span>
              </Link>
              <Link className="account-link" href="/account">My learning</Link>
              {user.app_metadata?.role === "admin" && (
                <Link className="account-link" href="/admin">Admin</Link>
              )}
              <form action={signOut}>
                <button className="text-button sign-out-button" type="submit">Sign out</button>
              </form>
            </>
          ) : (
            <>
              <Link className="login-link" href="/login">Log in</Link>
              <Link className="button button-small button-dark" href="/register">Create account</Link>
            </>
          )}
        </div>

        <Link className="mobile-job-search" href="/jobs" aria-label="Search chemistry jobs">
          <SearchIcon />
        </Link>

        <details className="mobile-menu">
          <summary aria-label="Open navigation menu">
            <span />
            <span />
          </summary>
          <nav aria-label="Mobile navigation">
            <Link href="/">Home</Link>
            <Link href="/about">About</Link>
            {user ? (
              <>
                <Link href="/account">My learning</Link>
                <Link href="/jobs">Search jobs</Link>
                {user.app_metadata?.role === "admin" && <Link href="/admin">Admin dashboard</Link>}
                <form action={signOut}>
                  <button className="text-button" type="submit">Sign out</button>
                </form>
              </>
            ) : (
              <>
                <Link href="/login">Log in</Link>
                <Link href="/register">Create account</Link>
              </>
            )}
          </nav>
        </details>
      </div>
    </header>
  );
}
