import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LessonQuiz } from "@/components/lesson-quiz";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { beginnerLessons } from "@/lib/lessons/beginner";
import { getCurrentUser } from "@/lib/auth";

type LessonPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return beginnerLessons.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: LessonPageProps): Promise<Metadata> {
  const { slug } = await params;
  const lesson = beginnerLessons.find((item) => item.slug === slug);

  return {
    title: lesson ? `${lesson.title} | chemstem` : "Chemistry lesson | chemstem",
    description: lesson?.description,
  };
}

export default async function BeginnerLessonPage({ params }: LessonPageProps) {
  const { slug } = await params;
  const lessonIndex = beginnerLessons.findIndex((item) => item.slug === slug);
  const lesson = beginnerLessons[lessonIndex];

  if (!lesson) {
    notFound();
  }

  const user = await getCurrentUser();
  const previousLesson = beginnerLessons[lessonIndex - 1];
  const nextLesson = beginnerLessons[lessonIndex + 1];

  return (
    <>
      <SiteHeader user={user} />
      <main className="content-page page-shell lesson-page">
        <nav className="lesson-breadcrumb" aria-label="Breadcrumb">
          <Link href="/beginner">Beginner Chemistry</Link>
          <span aria-hidden="true">/</span>
          <span>{lesson.title}</span>
        </nav>
        <header className="lesson-heading">
          <span className="content-kicker">Beginner chemistry · Lesson {lessonIndex + 1} of {beginnerLessons.length}</span>
          <h1>{lesson.title}</h1>
          <p>{lesson.description}</p>
        </header>

        <article className="lesson-content">
          <section className="lesson-definition">
            <span className="content-kicker">Simple definition</span>
            <p>{lesson.definition}</p>
          </section>

          <section className="lesson-section">
            <h2>Understand the idea</h2>
            {lesson.explanation.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          </section>

          <aside className="lesson-analogy">
            <span className="content-kicker">A real-world analogy</span>
            <p>{lesson.analogy}</p>
          </aside>

          <section className="lesson-section">
            <h2>Examples around you</h2>
            <ul className="lesson-examples">
              {lesson.examples.map((example) => <li key={example}>{example}</li>)}
            </ul>
          </section>

          {lesson.equations.length > 0 && (
            <section className="lesson-section">
              <h2>Equations and symbols</h2>
              <div className="lesson-equations">
                {lesson.equations.map((equation) => (
                  <div className="lesson-equation" key={equation.label}>
                    <h3>{equation.label}</h3>
                    <p className="equation-formula">{equation.formula}</p>
                    <p>{equation.note}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          <LessonQuiz questions={lesson.quiz} />

          <section className="lesson-references">
            <h2>Sources for further reading</h2>
            <p>These original explanations are written for this site. Use the open educational and academic sources below to study further.</p>
            <ul>
              {lesson.references.map((reference) => (
                <li key={reference.href}>
                  <a href={reference.href} rel="noreferrer" target="_blank">{reference.label}</a>
                </li>
              ))}
            </ul>
          </section>
        </article>

        <nav className="lesson-pagination" aria-label="Lesson navigation">
          {previousLesson ? (
            <Link href={`/beginner/${previousLesson.slug}`}>
              <span>Previous lesson</span>
              <strong>{previousLesson.title}</strong>
            </Link>
          ) : <span />}
          {nextLesson ? (
            <Link className="next-lesson" href={`/beginner/${nextLesson.slug}`}>
              <span>Next lesson</span>
              <strong>{nextLesson.title}</strong>
            </Link>
          ) : <Link className="next-lesson" href="/beginner"><span>Course complete</span><strong>All beginner topics</strong></Link>}
        </nav>
      </main>
      <SiteFooter />
    </>
  );
}
