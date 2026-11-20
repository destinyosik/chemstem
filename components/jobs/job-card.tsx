export type ChemistryJob = {
  id: string;
  industry_slug: string;
  industry_name: string;
  title: string;
  company_name: string;
  location: string;
  description: string;
  qualifications: string;
  experience: string;
  technical_skills: string[];
  application_deadline: string | null;
  salary_text: string | null;
  application_url: string;
  source_name: string;
  discovered_at: string;
  expires_at: string | null;
};

export function JobCard({ job }: { job: ChemistryJob }) {
  return (
    <article className="chemistry-job-card">
      <div className="job-card-heading">
        <div>
          <span className="job-industry-label">{job.industry_name}</span>
          <h2>{job.title}</h2>
        </div>
        {job.salary_text && <span className="job-salary">{job.salary_text}</span>}
      </div>
      <p className="job-company">{job.company_name} <span>·</span> {job.location}</p>
      <p className="job-description">{job.description}</p>
      {job.qualifications && (
        <p className="job-detail"><strong>Qualifications:</strong> {job.qualifications}</p>
      )}
      {job.experience && (
        <p className="job-detail"><strong>Experience:</strong> {job.experience}</p>
      )}
      {job.technical_skills.length > 0 && (
        <div className="job-skills">
          <strong>Technical skills</strong>
          <ul>{job.technical_skills.map((skill) => <li key={skill}>{skill}</li>)}</ul>
        </div>
      )}
      <div className="job-card-footer">
        <div className="job-dates">
          {job.application_deadline && (
            <span>Deadline: {new Date(`${job.application_deadline}T00:00:00`).toLocaleDateString("en", { dateStyle: "medium" })}</span>
          )}
          <span>Discovered: {new Date(job.discovered_at).toLocaleDateString("en", { dateStyle: "medium" })}</span>
        </div>
        <a className="button button-dark button-small" href={job.application_url} target="_blank" rel="noopener noreferrer">
          Original application
        </a>
      </div>
    </article>
  );
}
