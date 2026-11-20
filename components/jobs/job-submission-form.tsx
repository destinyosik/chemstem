"use client";

import { useActionState } from "react";
import { submitChemistryJob, type JobFormState } from "@/app/actions/jobs";
import { chemistryIndustries } from "@/lib/jobs/industries";

const initialState: JobFormState = {};

type JobIndustryOption = {
  slug: string;
  name: string;
};

type JobSubmissionFormProps = {
  industrySlug?: string;
  industries?: readonly JobIndustryOption[];
};

export function JobSubmissionForm({ industrySlug, industries = chemistryIndustries }: JobSubmissionFormProps) {
  const [state, formAction, isPending] = useActionState(submitChemistryJob, initialState);

  return (
    <details className="job-submission">
      <summary>Suggest a chemistry job for review</summary>
      <form action={formAction} className="admin-content-form">
        {industrySlug ? (
          <input name="industry_slug" type="hidden" value={industrySlug} />
        ) : (
          <label>
            Industry
            <select name="industry_slug" required defaultValue="">
              <option disabled value="">Choose an industry</option>
              {industries.map((industry) => (
                <option key={industry.slug} value={industry.slug}>{industry.name}</option>
              ))}
            </select>
          </label>
        )}
        <label>Job title<input maxLength={180} name="title" required /></label>
        <label>Company name<input maxLength={180} name="company_name" required /></label>
        <label>Location<input maxLength={180} name="location" required /></label>
        <label>Description<textarea maxLength={5000} name="description" required rows={4} /></label>
        <label>Required qualifications<textarea maxLength={2000} name="qualifications" rows={3} /></label>
        <label>Required experience<input maxLength={1000} name="experience" /></label>
        <label>Technical skills <span>Separate skills with commas</span><input maxLength={1000} name="technical_skills" /></label>
        <label>Application deadline<input name="application_deadline" type="date" /></label>
        <label>Salary, if public<input maxLength={120} name="salary_text" /></label>
        <label>Original application link<input name="application_url" placeholder="https://" required type="url" /></label>
        {state.error && <p className="form-message form-error" role="alert">{state.error}</p>}
        {state.message && <p className="form-message form-success" role="status">{state.message}</p>}
        <button className="button button-dark" disabled={isPending} type="submit">
          {isPending ? "Submitting for review…" : "Submit for admin approval"}
        </button>
      </form>
    </details>
  );
}
