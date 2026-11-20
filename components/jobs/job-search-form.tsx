import { SearchIcon } from "@/components/icons";

type JobSearchFormProps = {
  defaultValue?: string;
  action?: string;
};

export function JobSearchForm({ defaultValue, action = "/jobs/search" }: JobSearchFormProps) {
  return (
    <form action={action} className="job-search-form" method="get" role="search">
      <label className="sr-only" htmlFor="chemistry-job-search">Search chemistry jobs</label>
      <SearchIcon />
      <input
        autoComplete="off"
        defaultValue={defaultValue}
        id="chemistry-job-search"
        maxLength={120}
        name="q"
        placeholder="Search chemistry roles, skills, or companies"
        type="search"
      />
      <button className="button button-dark" type="submit">Search</button>
    </form>
  );
}
