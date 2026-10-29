"use client";

import Image from "next/image";
import Link from "next/link";
import { type FormEvent, useRef, useState } from "react";
import { educationLevels, getAreaVacancies, getCareerArea } from "@/data/careers";
import { getCompanySlug } from "@/data/companyProfiles";

const maxCvBytes = 5 * 1024 * 1024;

// /careers/<area-slug>: the area's vacancy cards and the application form.
export default function CareerVacancies({ slug }: { slug: string }) {
  const area = getCareerArea(slug);
  const areaVacancies = area ? getAreaVacancies(area.slug) : [];
  const [vacancyId, setVacancyId] = useState(areaVacancies[0]?.id ?? "");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const formSectionRef = useRef<HTMLElement>(null);

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

  function applyFor(id: string) {
    setVacancyId(id);
    setStatus("idle");
    setMessage("");
    formSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => formRef.current?.querySelector<HTMLInputElement>("#vc-full-name")?.focus({ preventScroll: true }), 450);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const cv = (form.elements.namedItem("cv") as HTMLInputElement).files?.[0];
    if (cv && cv.size > maxCvBytes) {
      setStatus("error");
      setMessage("Your CV must be 5 MB or smaller.");
      return;
    }
    setStatus("sending");
    setMessage("");
    try {
      const response = await fetch("/api/careers/applications", { method: "POST", body: new FormData(form) });
      const result = (await response.json().catch(() => ({}))) as { message?: string };
      if (!response.ok) throw new Error(result.message || "Your application could not be sent. Please try again.");
      setStatus("sent");
      form.reset();
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Your application could not be sent. Please try again.");
    }
  }

  const chosen = areaVacancies.find((item) => item.id === vacancyId);
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
            <a className="vc-hero-link" href="#apply">Apply now</a>
          </div>
          <dl className="vc-hero-facts">
            <div><dt>Open roles</dt><dd className="num">{areaVacancies.length}</dd></div>
            <div><dt>Openings</dt><dd className="num">{openings}</dd></div>
            <div><dt>Companies</dt><dd className="num">{area.companyNames.length}</dd></div>
            <div><dt>Sector</dt><dd>{area.type}</dd></div>
          </dl>
        </div>
      </section>

      <section className="vc-company-strip" aria-label="Companies in this area">
        <div className="bx-wrap">
          <ul className="vc-companies">
            {area.companyNames.map((name) => (
              <li key={name}><Link href={`/businesses/${getCompanySlug(name)}`}>{name}</Link></li>
            ))}
          </ul>
        </div>
      </section>

      <section className="vc-list" id="vacancies" aria-labelledby="vc-list-title">
        <div className="bx-wrap">
          <div className="vc-list-head">
            <h2 id="vc-list-title">Open vacancies</h2>
            <p className="vc-count"><span className="num">{areaVacancies.length}</span> {areaVacancies.length === 1 ? "position" : "positions"}</p>
          </div>
          {areaVacancies.length ? (
            <ul className="vc-cards">
              {areaVacancies.map((vacancy) => (
                <li className="vc-card" key={vacancy.id}>
                  <div className="vc-card-top">
                    <div>
                      <h3>{vacancy.title}</h3>
                      <p className="vc-company">{vacancy.company}</p>
                    </div>
                    {vacancy.sample && <span className="vc-sample">Sample listing</span>}
                  </div>
                  <p className="vc-summary">{vacancy.summary}</p>
                  <dl className="vc-facts">
                    <div><dt>Location</dt><dd>{vacancy.location}</dd></div>
                    <div><dt>Type</dt><dd>{vacancy.employmentType}</dd></div>
                    <div><dt>Openings</dt><dd className="num">{vacancy.openings}</dd></div>
                    <div><dt>Apply by</dt><dd>{vacancy.deadline}</dd></div>
                  </dl>
                  <div className="vc-reqs">
                    <h4>Requirements</h4>
                    <dl>
                      <div><dt>Education</dt><dd>{vacancy.education}</dd></div>
                      <div><dt>Experience</dt><dd>{vacancy.experience}</dd></div>
                      <div>
                        <dt>Key skills</dt>
                        <dd><ul>{vacancy.skills.map((skill) => <li key={skill}>{skill}</li>)}</ul></dd>
                      </div>
                    </dl>
                  </div>
                  <button className="bx-button vc-apply" type="button" onClick={() => applyFor(vacancy.id)}>
                    Apply for this role
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="vc-empty">No open vacancies in this area right now. You can still send your CV through the form below and the companies will consider it for future roles.</p>
          )}
        </div>
      </section>

      <section className="vc-apply-section" id="apply" ref={formSectionRef} aria-labelledby="vc-form-title">
        <div className="bx-wrap vc-form-grid">
          <div className="vc-form-intro">
            <h2 id="vc-form-title">Apply now</h2>
            <p className="bx-lead">Fill in your details and attach your CV. The company reviews every application and contacts shortlisted candidates.</p>
            {chosen && (
              <div className="vc-chosen">
                <span>Applying for</span>
                <strong>{chosen.title}</strong>
                <span>{chosen.company}</span>
              </div>
            )}
          </div>

          {status === "sent" ? (
            <div className="vc-success" role="status">
              <h3>Application sent</h3>
              <p>Thank you. Your application{chosen ? ` for ${chosen.title}` : ""} has been received. The company will contact you if you are shortlisted.</p>
              <button className="bx-button" type="button" onClick={() => setStatus("idle")}>Send another application</button>
            </div>
          ) : (
            <form className="vc-form" ref={formRef} onSubmit={submit} noValidate={false}>
              <div className="vc-field vc-field-wide">
                <label htmlFor="vc-vacancy">Position</label>
                <select id="vc-vacancy" name="vacancyId" value={vacancyId || `general:${area.slug}`} onChange={(event) => setVacancyId(event.target.value)} required>
                  {areaVacancies.map((vacancy) => <option key={vacancy.id} value={vacancy.id}>{vacancy.title}, {vacancy.company}</option>)}
                  <option value={`general:${area.slug}`}>General application, {area.title}</option>
                </select>
              </div>

              <fieldset className="vc-group">
                <legend>Personal details</legend>
                <div className="vc-field vc-field-wide">
                  <label htmlFor="vc-full-name">Full name</label>
                  <input id="vc-full-name" name="fullName" autoComplete="name" required minLength={2} maxLength={120} />
                </div>
                <div className="vc-field">
                  <label htmlFor="vc-email">Email</label>
                  <input id="vc-email" name="email" type="email" autoComplete="email" required maxLength={200} />
                </div>
                <div className="vc-field">
                  <label htmlFor="vc-phone">Phone</label>
                  <input id="vc-phone" name="phone" type="tel" autoComplete="tel" required pattern="[+0-9][0-9 \-]{6,19}" placeholder="98XXXXXXXX" />
                </div>
                <div className="vc-field">
                  <label htmlFor="vc-age">Age</label>
                  <input id="vc-age" name="age" type="number" inputMode="numeric" min={16} max={80} required />
                </div>
                <div className="vc-field">
                  <label htmlFor="vc-gender">Gender <span className="vc-optional">(optional)</span></label>
                  <select id="vc-gender" name="gender" defaultValue="">
                    <option value="">Prefer not to say</option>
                    <option>Female</option>
                    <option>Male</option>
                    <option>Other</option>
                  </select>
                </div>
                <div className="vc-field vc-field-wide">
                  <label htmlFor="vc-address">Address</label>
                  <input id="vc-address" name="address" autoComplete="street-address" required maxLength={200} placeholder="City, district" />
                </div>
              </fieldset>

              <fieldset className="vc-group">
                <legend>Qualifications</legend>
                <div className="vc-field">
                  <label htmlFor="vc-education">Highest education</label>
                  <select id="vc-education" name="education" defaultValue="" required>
                    <option value="" disabled>Choose one</option>
                    {educationLevels.map((level) => <option key={level}>{level}</option>)}
                  </select>
                </div>
                <div className="vc-field">
                  <label htmlFor="vc-experience">Years of experience</label>
                  <input id="vc-experience" name="experienceYears" type="number" inputMode="decimal" min={0} max={60} step={0.5} required />
                </div>
                <div className="vc-field">
                  <label htmlFor="vc-employer">Current employer <span className="vc-optional">(optional)</span></label>
                  <input id="vc-employer" name="currentEmployer" autoComplete="organization" maxLength={150} />
                </div>
                <div className="vc-field">
                  <label htmlFor="vc-salary">Expected salary <span className="vc-optional">(optional)</span></label>
                  <input id="vc-salary" name="expectedSalary" maxLength={60} placeholder="NPR per month" />
                </div>
              </fieldset>

              <fieldset className="vc-group">
                <legend>Your CV</legend>
                <div className="vc-field vc-field-wide">
                  <label htmlFor="vc-cv">Upload CV</label>
                  <input id="vc-cv" name="cv" type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" required />
                  <p className="vc-hint">PDF or Word, 5 MB or smaller.</p>
                </div>
                <div className="vc-field vc-field-wide">
                  <label htmlFor="vc-cover">Cover letter <span className="vc-optional">(optional)</span></label>
                  <textarea id="vc-cover" name="coverLetter" rows={5} maxLength={3000} placeholder="Tell us why you are a good fit for this role." />
                </div>
              </fieldset>

              <div className="vc-honeypot" aria-hidden="true">
                <label htmlFor="vc-website">Website</label>
                <input id="vc-website" name="website" tabIndex={-1} autoComplete="off" />
              </div>

              <label className="vc-consent">
                <input type="checkbox" name="consent" value="yes" required />
                <span>I confirm the information I have given is correct, and I agree to Sanjeevani Group storing my application to assess it for this and similar roles. See the <Link href="/privacy-policy">privacy policy</Link>.</span>
              </label>

              {status === "error" && <p className="vc-error" role="alert">{message}</p>}

              <button className="bx-button vc-submit" type="submit" disabled={status === "sending"}>
                {status === "sending" ? "Sending…" : "Submit application"}
              </button>
            </form>
          )}
        </div>
      </section>
    </>
  );
}
