import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { requireActiveUser } from "@/lib/auth";
import { intermediateLessons } from "@/lib/lessons/intermediate";

type IntermediatePageProps = {
  searchParams: Promise<{ registered?: string }>;
};

export default async function IntermediatePage({ searchParams }: IntermediatePageProps) {
  const [user, params] = await Promise.all([
    requireActiveUser("/intermediate", "/register"),
    searchParams,
  ]);

  return (
    <>
      <SiteHeader user={user} />
      <main className="content-page page-shell">
        <section className="content-panel">
          <span className="content-kicker">Account learning path · Intermediate</span>
          <h1>Intermediate Chemistry</h1>
          <p>
            Core university-level reading in physical, inorganic, organic, and analytical chemistry.
          </p>
          {params.registered === "1" && (
            <p className="form-message form-success" role="status">
              Your chemist application has been submitted and your account is ready.
            </p>
          )}
          <div className="intermediate-curriculum">
            {intermediateLessons.map((lesson, index) => (
              <details className="intermediate-unit" key={lesson.title}>
                <summary>
                  <span className="job-industry-number">{String(index + 1).padStart(2, "0")}</span>
                  <span>
                    <strong>{lesson.title}</strong>
                    <small>{lesson.summary}</small>
                  </span>
                  <span aria-hidden="true">+</span>
                </summary>
                <div className="intermediate-unit-content">
                  <p>{lesson.explanation}</p>
                  <p className="intermediate-equation"><strong>Key relation:</strong> <span>{lesson.equation}</span></p>
                  <p><strong>Where it is used:</strong> {lesson.application}</p>
                </div>
              </details>
            ))}
          </div>
          <nav className="lesson-references" aria-label="Further university-level reading">
            <h2>Further reading</h2>
            <ul>
              <li><a href="https://openstax.org/details/books/chemistry-2e" rel="noreferrer" target="_blank">OpenStax Chemistry 2e</a></li>
              <li><a href="https://chem.libretexts.org/Bookshelves/General_Chemistry" rel="noreferrer" target="_blank">Chemistry LibreTexts — General Chemistry</a></li>
            </ul>
          </nav>
          <Link className="content-back" href="/#learning-paths"><span>←</span> Back to learning paths</Link>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
