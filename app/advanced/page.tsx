import Link from "next/link";
import { careerRoadmaps, jobProcessGuides } from "@/lib/advanced/content";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { isPremiumUser, requireActiveUser } from "@/lib/auth";
import { createReadOnlyServerClient } from "@/lib/supabase/server";
import { CreatorGuidanceForm } from "@/components/creator-guidance-form";

type PremiumCourse = {
  id: string;
  title: string;
  description: string;
  instructor: string;
  amount_kobo: number;
  currency: string;
  duration: string;
  learning_outcomes: string[];
  materials: string[];
  enrollment_url: string;
};

type AdvancedOpportunity = {
  id: string;
  title: string;
  organization: string;
  location: string;
  employment_type: string;
  description: string;
  application_url: string;
  closing_at: string | null;
};

export default async function AdvancedPage() {
  const user = await requireActiveUser("/advanced");
  const hasPremium = await isPremiumUser(user);

  if (!hasPremium) {
    return (
      <>
        <SiteHeader user={user} />
        <main className="content-page page-shell">
          <section className="content-panel">
            <span className="content-kicker">Premium learning path · Advanced</span>
            <h1>Advanced Chemistry</h1>
            <p>Subscribe to Premium to Access Advanced Chemistry.</p>
            <Link className="button button-dark" href="/premium">View Premium plans</Link>
          </section>
        </main>
        <SiteFooter />
      </>
    );
  }

  const supabase = await createReadOnlyServerClient();
  const [{ data: courses, error: coursesError }, { data: opportunities, error: opportunitiesError }] =
    await Promise.all([
      supabase.rpc("list_premium_courses"),
      supabase.rpc("list_advanced_opportunities"),
    ]);

  if (coursesError) {
    throw new Error(`Unable to load Premium courses: ${coursesError.message}`);
  }
  if (opportunitiesError) {
    throw new Error(`Unable to load advanced opportunities: ${opportunitiesError.message}`);
  }

  const premiumCourses = (courses ?? []) as PremiumCourse[];
  const advancedOpportunities = (opportunities ?? []) as AdvancedOpportunity[];

  return (
    <>
      <SiteHeader user={user} />
      <main className="content-page page-shell advanced-page">
        <header className="beginner-heading">
          <span className="content-kicker">Premium learning path · Advanced</span>
          <h1>Advanced Chemistry</h1>
          <p>Build a specialist career, prepare for professional opportunities, and connect your chemistry knowledge to work that matters.</p>
          <Link className="button button-dark" href="/premium">Renew Premium membership</Link>
        </header>

        <section className="advanced-section" aria-labelledby="career-roadmaps">
          <span className="section-kicker">Choose a direction</span>
          <h2 id="career-roadmaps">Chemistry career roadmaps</h2>
          <div className="advanced-grid">
            {careerRoadmaps.map((roadmap) => (
              <article className="advanced-card" key={roadmap.title}>
                <h3>{roadmap.title}</h3>
                <p>{roadmap.summary}</p>
                <details>
                  <summary>Explore this pathway</summary>
                  <RoadmapDetails roadmap={roadmap} />
                </details>
              </article>
            ))}
          </div>
          <p className="advanced-disclaimer">Certification, licensing, and job requirements vary by country and employer. Verify current requirements with the relevant professional body and hiring organization.</p>
        </section>

        <section className="advanced-section" aria-labelledby="job-guidance">
          <span className="section-kicker">Prepare with purpose</span>
          <h2 id="job-guidance">Job process guidance</h2>
          <div className="advanced-grid">
            {jobProcessGuides.map((guide) => (
              <article className="advanced-card" key={guide.title}>
                <h3>{guide.title}</h3>
                <ol className="advanced-list">
                  {guide.steps.map((step) => <li key={step}>{step}</li>)}
                </ol>
              </article>
            ))}
          </div>
        </section>

        <section className="advanced-section" aria-labelledby="paid-courses">
          <span className="section-kicker">Learn from specialists</span>
          <h2 id="paid-courses">Paid chemistry courses</h2>
          {premiumCourses.length ? (
            <div className="advanced-grid">
              {premiumCourses.map((course) => (
                <article className="advanced-card" key={course.id}>
                  <h3>{course.title}</h3>
                  <p>{course.description}</p>
                  <p><strong>Instructor:</strong> {course.instructor}</p>
                  <p><strong>Duration:</strong> {course.duration}</p>
                  <p><strong>Price:</strong> {formatNaira(course.amount_kobo, course.currency)}</p>
                  <h4>Learning outcomes</h4>
                  <ul className="advanced-list">
                    {course.learning_outcomes.map((outcome) => <li key={outcome}>{outcome}</li>)}
                  </ul>
                  <h4>Course materials</h4>
                  <ul className="advanced-list">
                    {course.materials.map((material) => <li key={material}>{material}</li>)}
                  </ul>
                  <a className="button button-dark" href={course.enrollment_url} target="_blank" rel="noreferrer">
                    Enrol in this course
                  </a>
                </article>
              ))}
            </div>
          ) : (
            <div className="coming-soon">Courses will appear here when the Chemstem administrator publishes them.</div>
          )}
        </section>

        <section className="advanced-section" aria-labelledby="advanced-jobs">
          <span className="section-kicker">Curated opportunities</span>
          <h2 id="advanced-jobs">Advanced job opportunities</h2>
          {advancedOpportunities.length ? (
            <div className="advanced-grid">
              {advancedOpportunities.map((opportunity) => (
                <article className="advanced-card" key={opportunity.id}>
                  <h3>{opportunity.title}</h3>
                  <p><strong>{opportunity.organization}</strong> · {opportunity.location}</p>
                  <p>{opportunity.employment_type}</p>
                  <p>{opportunity.description}</p>
                  {opportunity.closing_at && (
                    <p><strong>Apply by:</strong> {new Date(opportunity.closing_at).toLocaleDateString("en", { dateStyle: "medium" })}</p>
                  )}
                  <a className="button button-dark" href={opportunity.application_url} target="_blank" rel="noreferrer">
                    View opportunity
                  </a>
                </article>
              ))}
            </div>
          ) : (
            <div className="coming-soon">New specialist chemistry opportunities will be posted here as they are curated.</div>
          )}
        </section>

        <section className="advanced-section" aria-labelledby="creator-guidance">
          <span className="section-kicker">Personalized professional support</span>
          <h2 id="creator-guidance">Connect directly with the creator</h2>
          <p>Share what guidance you need. Your message is saved privately for the Chemstem team.</p>
          <CreatorGuidanceForm />
        </section>

        <section className="advanced-section">
          <Link className="content-back" href="/#learning-paths"><span>←</span> Back to learning paths</Link>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

function RoadmapDetails({ roadmap }: { roadmap: (typeof careerRoadmaps)[number] }) {
  const sections = [
    ["Relevant university knowledge", roadmap.universityKnowledge],
    ["Additional skills to acquire", roadmap.additionalSkills],
    ["Professional certifications", roadmap.certifications],
    ["Practical experience", roadmap.practicalExperience],
    ["Entry-level positions", roadmap.entryPositions],
    ["Career progression", roadmap.progression],
    ["Expected responsibilities", roadmap.responsibilities],
  ] as const;

  return (
    <div className="roadmap-details">
      {sections.map(([title, items]) => (
        <div key={title}>
          <h4>{title}</h4>
          <ul className="advanced-list">{items.map((item) => <li key={item}>{item}</li>)}</ul>
        </div>
      ))}
    </div>
  );
}

function formatNaira(amountKobo: number, currency: string): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amountKobo / 100);
}
