import Link from "next/link";
import { AtomIcon } from "@/components/icons";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <Link className="brand footer-brand" href="/">
        <span className="brand-mark"><AtomIcon /></span>
        <span>chemstem</span>
      </Link>
      <p>Curiosity, knowledge, and opportunity — connected by chemistry.</p>
      <span className="footer-note">© {new Date().getFullYear()} chemstem</span>
    </footer>
  );
}
