import Link from "next/link";
import { ArrowIcon, AtomIcon, LockIcon } from "@/components/icons";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getCurrentUser, isPremiumUser } from "@/lib/auth";

export default async function HomePage() {
  const user = await getCurrentUser();
  const hasAccount = user !== null;
  const hasPremium = isPremiumUser(user);
  const intermediateHref = hasAccount ? "/intermediate" : "/register?next=/intermediate";
  const advancedHref = !hasAccount
    ? "/register?next=/advanced"
    : hasPremium
      ? "/advanced"
      : "/premium";

  return (
    <>
      <SiteHeader user={user} />
      <main>
        <section className="hero page-shell">
          <div className="hero-copy">
            <span className="eyebrow"><span className="eyebrow-dot" /> A new perspective on chemistry</span>
            <h1>Learn chemistry.<br /><span>Shape what&apos;s next.</span></h1>
            <p className="hero-description">
              A place to grow your knowledge, explore the science shaping our world, and find your next opportunity.
            </p>
            <div className="hero-actions">
              <Link className="button button-dark" href="#learning-paths">
                Explore learning paths <ArrowIcon />
              </Link>
              <Link className="hero-text-link" href="/jobs">Explore careers <ArrowIcon /></Link>
            </div>
            <div className="hero-note">
              <span className="note-line" />
              <span>Built for every stage of your chemistry journey</span>
            </div>
          </div>

          <div className="hero-visual" role="img" aria-label="An abstract molecular illustration">
            <div className="visual-orbit orbit-one" />
            <div className="visual-orbit orbit-two" />
            <div className="visual-orbit orbit-three" />
            <div className="molecule molecule-one"><span /><i /><b /></div>
            <div className="molecule molecule-two"><span /><i /><b /></div>
            <div className="molecule molecule-three"><span /><i /><b /></div>
            <div className="element-tile">
              <span className="element-number">01</span>
              <strong>H</strong>
              <span className="element-name">Hydrogen</span>
            </div>
            <div className="visual-caption">
              <AtomIcon />
              <span>Every big idea<br />starts with curiosity.</span>
            </div>
            <span className="visual-spark spark-one">✳</span>
            <span className="visual-spark spark-two">✳</span>
          </div>
        </section>

        <section className="learning-section page-shell" id="learning-paths">
          <div className="section-heading">
            <div>
              <span className="section-kicker">Your learning journey</span>
              <h2>Find your level.<br /><span>Follow your curiosity.</span></h2>
            </div>
            <p>Start with the foundations or take your expertise further. There&apos;s a path for every kind of curious mind.</p>
          </div>

          <div className="path-grid">
            <article className="path-card beginner-card">
              <div className="card-topline">
                <span className="path-number">01 / FOUNDATIONS</span>
                <span className="access-pill access-public">Open to everyone</span>
              </div>
              <div className="path-illustration illustration-beginner" aria-hidden="true">
                <span className="illustration-orbit" /><span className="illustration-dot dot-a" />
                <span className="illustration-dot dot-b" /><span className="illustration-dot dot-c" />
              </div>
              <div className="path-copy">
                <h3>Beginner Guides to Chemistry</h3>
                <p>Make sense of the elements, reactions, and everyday science all around you.</p>
              </div>
              <Link className="path-link" href="/beginner">
                Start learning <ArrowIcon />
              </Link>
            </article>

            <article className="path-card intermediate-card">
              <div className="card-topline">
                <span className="path-number">02 / DEEPER KNOWLEDGE</span>
                <span className="access-pill access-account">
                  {!hasAccount && <LockIcon />}
                  {hasAccount ? "Your learning path" : "Free account"}
                </span>
              </div>
              <div className="path-illustration illustration-intermediate" aria-hidden="true">
                <span className="bond bond-a" /><span className="bond bond-b" />
                <span className="atom atom-a">C</span><span className="atom atom-b">O</span>
                <span className="atom atom-c">N</span><span className="atom atom-d">H</span>
              </div>
              <div className="path-copy">
                <h3>Intermediate Chemistry</h3>
                <p>Connect core concepts and build confidence with more advanced chemistry.</p>
              </div>
              <Link className="path-link" href={intermediateHref}>
                {hasAccount ? "Continue learning" : "Create a free account"} <ArrowIcon />
              </Link>
            </article>

            <article className="path-card advanced-card">
              <div className="card-topline">
                <span className="path-number">03 / ADVANCED STUDY</span>
                <span className="access-pill access-premium">
                  {!hasPremium && <LockIcon />}
                  {hasPremium ? "Premium member" : "Premium"}
                </span>
              </div>
              <div className="path-illustration illustration-advanced" aria-hidden="true">
                <span className="advanced-ring ring-a" /><span className="advanced-ring ring-b" />
                <span className="advanced-core" /><span className="advanced-satellite satellite-a" />
                <span className="advanced-satellite satellite-b" />
              </div>
              <div className="path-copy">
                <h3>Advanced Chemistry</h3>
                <p>Go further into specialist topics and deepen your command of the subject.</p>
              </div>
              <Link className="path-link" href={advancedHref}>
                {hasPremium
                  ? "Continue learning"
                  : hasAccount
                    ? "Subscribe to Premium"
                    : "Create an account"} <ArrowIcon />
              </Link>
            </article>
          </div>

          <Link className="jobs-banner" href="/jobs">
            <span className="jobs-icon"><AtomIcon /></span>
            <span className="jobs-copy">
              <span className="jobs-kicker">Your next chapter</span>
              <strong>Apply for a Job</strong>
              <span>Explore opportunities across the chemistry industry.</span>
            </span>
            <span className="jobs-cta">Explore careers <ArrowIcon /></span>
            <span className="jobs-decoration" aria-hidden="true">C<span>6</span></span>
          </Link>
        </section>

        <section className="closing-note page-shell">
          <span className="closing-mark"><AtomIcon /></span>
          <p>Good science starts with a question.<br /><span>What will yours be?</span></p>
          <Link href="#learning-paths" aria-label="Explore chemistry learning paths"><ArrowIcon /></Link>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
