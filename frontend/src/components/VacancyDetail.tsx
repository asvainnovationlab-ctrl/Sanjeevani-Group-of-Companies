import Link from "next/link";
import ApplicationForm from "@/components/ApplicationForm";
import { getAreaVacancies, getCareerArea } from "@/data/careers";
import { getCompanySlug } from "@/data/companyProfiles";

// Icons for the Position details card (24px, filled).
const factIcons: Record<string, JSX.Element> = {
  people: <path d="M16 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-8 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm0 2c-2.7 0-8 1.3-8 4v2h16v-2c0-2.7-5.3-4-8-4Zm8 0c-.3 0-.7 0-1.1.1 1.3.9 2.1 2.1 2.1 3.9v2h7v-2c0-2.7-5.3-4-8-4Z" />,
  building: <path d="M4 21V3h11v6h5v12h-6v-4h-2v4H4Zm3-3h2v-2H7v2Zm0-4h2v-2H7v2Zm0-4h2V8H7v2Zm0-4h2V4H7v2Zm4 8h2v-2h-2v2Zm0-4h2V8h-2v2Zm0-4h2V4h-2v2Zm5 8h2v-2h-2v2Z" />,
  pin: <path d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5Z" />,
  briefcase: <path d="M9 4h6a2 2 0 0 1 2 2v1h3a2 2 0 0 1 2 2v4h-8v-1h-4v1H2V9a2 2 0 0 1 2-2h3V6a2 2 0 0 1 2-2Zm0 3h6V6H9v1ZM2 15h8v2h4v-2h8v4a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-4Z" />,
  calendar: <path d="M7 2h2v2h6V2h2v2h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2V2ZM5 10v10h14V10H5Z" />,
  money: <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm1 15.9V19h-2v-1.1c-1.6-.3-2.9-1.3-3-3h2c.1.8.8 1.4 2 1.4 1.3 0 1.7-.6 1.7-1.1 0-.6-.4-1.1-2-1.5-1.9-.4-3.2-1.2-3.2-2.8 0-1.4 1-2.3 2.5-2.6V7h2v1.3c1.5.4 2.3 1.5 2.3 2.8h-2c0-.8-.5-1.3-1.6-1.3-1 0-1.6.4-1.6 1.1 0 .5.4.9 1.9 1.3 1.6.4 3.3 1 3.3 3 0 1.4-1 2.4-2.3 2.7Z" />,
};

// /careers/<area-slug>/<vacancy-id>: one role in full, with its position
// details card and the application form below.
export default function VacancyDetail({ areaSlug, vacancyId }: { areaSlug: string; vacancyId: string }) {
  const area = getCareerArea(areaSlug);
  const vacancy = area ? getAreaVacancies(area.slug).find((item) => item.id === vacancyId) : undefined;

  if (!area || !vacancy) {
    return (
      <section className="vc-missing">
        <div className="bx-wrap">
          <h1>Position not found</h1>
          <p className="bx-lead">This position may have closed or moved.</p>
          <Link className="bx-button" href={area ? `/careers/${area.slug}` : "/careers"}>See open positions</Link>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="vd-hero" aria-labelledby="vd-title">
        <div className="bx-wrap vd-hero-inner">
          <ul className="vd-hero-tags" aria-label="Role summary">
            <li className="vd-status">Open</li>
            <li>{vacancy.location}</li>
            <li>{vacancy.employmentType}</li>
          </ul>
          <h1 id="vd-title">{vacancy.title}</h1>
          <p className="vd-hero-company"><Link href={`/businesses/${getCompanySlug(vacancy.company)}`}>{vacancy.company}</Link></p>
          <div className="vd-hero-row">
            <nav className="vd-crumbs" aria-label="Breadcrumb">
              <Link href="/">Home</Link>
              <span aria-hidden="true">/</span>
              <Link href="/careers">Careers</Link>
              <span aria-hidden="true">/</span>
              <Link href={`/careers/${area.slug}#vacancies`}>{area.title}</Link>
            </nav>
            <a className="vd-hero-apply" href="#apply">Apply now</a>
          </div>
        </div>
      </section>

      <section className="vd-body" aria-label="Position details">
        <div className="bx-wrap vd-grid">
          <div className="vd-content">
            <h2>Job description</h2>
            <p>{vacancy.summary}</p>
            <h2>Qualifications</h2>
            <ul>
              <li>{vacancy.education}</li>
            </ul>
            <h2>Experience</h2>
            <ul>
              <li>{vacancy.experience}</li>
            </ul>
            <h2>Key skills</h2>
            <ul>
              {vacancy.skills.map((skill) => <li key={skill}>{skill}</li>)}
            </ul>
          </div>

          <aside className="vd-card" aria-label="Position summary">
            <h2>Position details</h2>
            {/* One line per fact, each led by its icon; the label stays for screen readers. */}
            <dl className="vd-facts">
              {[
                { label: "Openings", icon: "people", value: <><span className="num">{vacancy.openings}</span> {vacancy.openings === 1 ? "position" : "positions"} open</> },
                { label: "Company", icon: "building", value: vacancy.company },
                { label: "Location", icon: "pin", value: vacancy.location },
                { label: "Type", icon: "briefcase", value: vacancy.employmentType },
                { label: "Age", icon: "calendar", value: vacancy.ageRange ? `Age: ${vacancy.ageRange}` : "[Add age range]" },
                { label: "Salary", icon: "money", value: vacancy.salary || "[Add salary]" },
              ].map((fact) => (
                <div key={fact.label}>
                  <dt>
                    <svg viewBox="0 0 24 24" aria-hidden="true">{factIcons[fact.icon]}</svg>
                    <span className="visually-hidden">{fact.label}</span>
                  </dt>
                  <dd>{fact.value}</dd>
                </div>
              ))}
            </dl>
            <p className="vd-deadline">Apply before <strong>{vacancy.deadline}</strong></p>
            <a className="bx-button vd-card-apply" href="#apply">Apply for this position</a>
          </aside>
        </div>
      </section>

      <ApplicationForm area={area} vacancy={vacancy} hiddenUntilApply />
    </>
  );
}
