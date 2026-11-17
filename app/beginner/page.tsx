import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { beginnerLessons } from "@/lib/lessons/beginner";
import { getCurrentUser } from "@/lib/auth";

export default async function BeginnerPage() {
  const user = await getCurrentUser();

  return (
    <>
      <SiteHeader user={user} />
      <main className="content-page page-shell beginner-page">
        <header className="beginner-heading">
          <span className="content-kicker">Open learning · No account required</span>
          <h1>Beginner Guides to Chemistry</h1>
          <p>Build your understanding one topic at a time. Each guide includes a clear explanation, everyday examples, equations where useful, a short quiz, and sources for further reading.</p>
        </header>
        <ol className="beginner-topic-list">
          {beginnerLessons.map((lesson, index) => (
            <li key={lesson.slug}>
              <Link className="beginner-topic-row" href={`/beginner/${lesson.slug}`}>
                <span className="topic-number">{String(index + 1).padStart(2, "0")}</span>
                <span className="topic-copy">
                  <strong>{lesson.title}</strong>
                  <span>{lesson.description}</span>
                </span>
                <span className="topic-arrow" aria-hidden="true">↗</span>
              </Link>
            </li>
          ))}
        </ol>
        <Link className="content-back" href="/#learning-paths"><span>←</span> Back to learning paths</Link>
      </main>
      <SiteFooter />
    </>
  );
}
