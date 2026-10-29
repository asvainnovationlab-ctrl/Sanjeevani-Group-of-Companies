import Image from "next/image";
import Link from "next/link";
import ApplicationForm from "@/components/ApplicationForm";
import { getAreaVacancies, getCareerArea } from "@/data/careers";
import { getCompanySlug } from "@/data/companyProfiles";

// Line icons for the role cards (stroked, 24px).
const roleIcons = {
  building: <path d="M4 21V4a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v17m0-10h4a1 1 0 0 1 1 1v9M3 21h18M8 7h3m-3 4h3m-3 4h3" />,
  pin: <path d="M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12Zm0-9.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />,
  clock: <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-13v4l3 2" />,
};

// /careers/<area-slug>: a full-screen photo hero, then the area's open roles
// as a short list. Each role opens its own detail page (/careers/<area>/<id>),
// where the application form lives.
export default function CareerVacancies({ slug }: { slug: string }) {
  const area = getCareerArea(slug);
  const areaVacancies = area ? getAreaVacancies(area.slug) : [];

  if (!area) {
    return (
      <section className="vc-missing">
        <div className="bx-wrap">
          <h1>Career area not found</h1>
          <p className="bx-lead">This career area is not on the Sanjeevani Group careers page.</p>
          <Link className="bx-button" href="/careers">See all career areas</Link>
        </div>
      </section>
    );
  }

  const openings = areaVacancies.reduce((total, item) => total + item.openings, 0);

  return (
    <>
      <section className="vc-hero" aria-labelledby="vc-title">
        <Image className="vc-hero-photo" src={area.image} alt="" fill priority sizes="100vw" />
        <div className="reference-wrap vc-hero-inner">
          {/* Same tag-and-statement treatment as the Businesses page hero. */}
          <div className="mission-hero-copy">
            <h1 id="vc-title" className="mission-hero-tag">{area.title}</h1>
            <p className="mission-hero-text">
              Open positions at {area.companyNames.length === 1 ? area.companyNames[0] : `${area.companyNames.length} Sanjeevani Group companies`}. Choose a role and apply with your CV.
            </p>
          </div>
          <div className="vc-hero-actions">
            <a className="vc-hero-button" href="#vacancies">See open roles</a>
          </div>
          <dl className="vc-hero-facts">
            <div><dt>Open roles</dt><dd className="num">{areaVacancies.length}</dd></div>
            <div><dt>Openings</dt><dd className="num">{openings}</dd></div>
            <div><dt>Companies</dt><dd className="num">{area.companyNames.length}</dd></div>
            <div><dt>Sector</dt><dd>{area.type}</dd></div>
          </dl>
        </div>
      </section>

      <section className="vc-list" id="vacancies" aria-labelledby="vc-list-title">
        <div className="bx-wrap">
          <div className="vc-list-head">
            <h2 id="vc-list-title">Open positions</h2>
            <p className="vc-count"><span className="num">{areaVacancies.length}</span> {areaVacancies.length === 1 ? "role" : "roles"}</p>
          </div>
          {areaVacancies.length ? (
            <ul className="vc-roles">
              {areaVacancies.map((vacancy) => {
                const detailHref = `/careers/${area.slug}/${vacancy.id}`;
                return (
                  <li className="vc-role" key={vacancy.id}>
                    <div className="vc-role-main">
                      <div className="vc-role-title">
                        <h3><Link href={detailHref}>{vacancy.title}</Link></h3>
                        <p className="vc-role-open">
                          <span className="num">{vacancy.openings}</span> {vacancy.openings === 1 ? "position" : "positions"} open
                        </p>
                      </div>
                      <ul className="vc-role-meta" aria-label="Role details">
                        <li><svg viewBox="0 0 24 24" aria-hidden="true">{roleIcons.building}</svg>{vacancy.company}</li>
                        <li><svg viewBox="0 0 24 24" aria-hidden="true">{roleIcons.pin}</svg>{vacancy.location}</li>
                        <li><svg viewBox="0 0 24 24" aria-hidden="true">{roleIcons.clock}</svg>{vacancy.employmentType}</li>
                      </ul>
                    </div>
                    <div className="vc-role-actions">
                      <Link className="vc-role-details" href={detailHref}>
                        View details
                        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6" /></svg>
                      </Link>
                      <Link className="bx-button vc-role-apply" href={`${detailHref}#apply`}>Apply</Link>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="vc-empty">No open positions in this area right now. You can still send a general application below.</p>
          )}
          <ul className="vc-companies" aria-label="Companies in this area">
            {area.companyNames.map((name) => (
              <li key={name}>
                <Link href={`/businesses/${getCompanySlug(name)}`}>
                  <svg viewBox="0 0 24 24" aria-hidden="true">{roleIcons.building}</svg>
                  {name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {areaVacancies.length === 0 && <ApplicationForm area={area} />}
    </>
  );
}
