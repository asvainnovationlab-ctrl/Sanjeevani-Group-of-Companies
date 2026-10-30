"use client";

import Link from "next/link";
import { type ChangeEvent, type DragEvent, type FormEvent, useEffect, useRef, useState } from "react";
import { type CareerArea, educationLevels, type Vacancy } from "@/data/careers";

const maxCvBytes = 5 * 1024 * 1024;
const cvExtensions = ["pdf", "doc", "docx", "jpg", "jpeg", "png"];
const cvAccept = ".pdf,.doc,.docx,.jpg,.jpeg,.png,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/png";

function formatSize(bytes: number) {
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Small line icons for the form's section headings.
const groupIcons = {
  person: <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0" />,
  cap: <path d="m2 9 10-5 10 5-10 5L2 9Zm4 2v5c3.5 3 8.5 3 12 0v-5M22 9v6" />,
  file: <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Zm0 0v5h5M9 13h6M9 17h6" />,
};

function GroupTitle({ icon, children }: { icon: keyof typeof groupIcons; children: string }) {
  return (
    <legend>
      <span className="vc-legend-icon" aria-hidden="true"><svg viewBox="0 0 24 24">{groupIcons[icon]}</svg></span>
      {children}
    </legend>
  );
}

// The job application form. On a vacancy's detail page it applies to that
// role; with no vacancy it sends a general application for the area.
// `hiddenUntilApply`: the form stays hidden until a link to #apply is clicked
// (or the page opens on #apply), then appears and scrolls into view.
export default function ApplicationForm({ area, vacancy, hiddenUntilApply = false }: { area: CareerArea; vacancy?: Vacancy; hiddenUntilApply?: boolean }) {
  const [shown, setShown] = useState(!hiddenUntilApply);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");
  const [reference, setReference] = useState("");
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [cvError, setCvError] = useState("");
  const [dragging, setDragging] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const cvInputRef = useRef<HTMLInputElement>(null);
  const vacancyId = vacancy ? vacancy.id : `general:${area.slug}`;

  useEffect(() => {
    if (!hiddenUntilApply) return;
    const reveal = () => {
      setShown(true);
      // Wait for the form to render before scrolling to it.
      requestAnimationFrame(() => requestAnimationFrame(() => {
        sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        sectionRef.current?.querySelector<HTMLInputElement>("#vc-full-name")?.focus({ preventScroll: true });
      }));
    };
    if (window.location.hash === "#apply") reveal();
    const onClick = (event: MouseEvent) => {
      const link = (event.target as Element | null)?.closest?.("a[href=\"#apply\"]");
      if (!link) return;
      event.preventDefault();
      window.history.replaceState(null, "", "#apply");
      reveal();
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [hiddenUntilApply]);

  function checkCv(file: File | undefined | null) {
    if (!file) {
      setCvFile(null);
      setCvError("");
      return;
    }
    const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!cvExtensions.includes(extension)) {
      setCvFile(null);
      setCvError("Choose a PDF, Word, JPG or PNG file.");
      if (cvInputRef.current) cvInputRef.current.value = "";
      return;
    }
    if (file.size > maxCvBytes) {
      setCvFile(null);
      setCvError("Your CV must be 5 MB or smaller.");
      if (cvInputRef.current) cvInputRef.current.value = "";
      return;
    }
    setCvError("");
    setCvFile(file);
  }

  function onCvChange(event: ChangeEvent<HTMLInputElement>) {
    checkCv(event.target.files?.[0]);
  }

  // The file input sits over the drop zone, so a dropped file lands in it
  // natively; this only drives the highlight and checks the file.
  function onDrop(event: DragEvent<HTMLDivElement>) {
    setDragging(false);
    checkCv(event.dataTransfer.files?.[0]);
  }

  function clearCv() {
    if (cvInputRef.current) cvInputRef.current.value = "";
    checkCv(null);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const cv = (form.elements.namedItem("cv") as HTMLInputElement).files?.[0];
    if (!cv) {
      setCvError("Attach your CV.");
      return;
    }
    if (cv.size > maxCvBytes) {
      setStatus("error");
      setMessage("Your CV must be 5 MB or smaller.");
      return;
    }
    setStatus("sending");
    setMessage("");
    try {
      const response = await fetch("/api/applications", { method: "POST", body: new FormData(form) });
      const result = (await response.json().catch(() => ({}))) as { referenceNumber?: string | null; error?: { message?: string } };
      if (!response.ok) throw new Error(result.error?.message || "Your application could not be sent. Please try again.");
      setReference(result.referenceNumber ?? "");
      setStatus("sent");
      setCvFile(null);
      form.reset();
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Your application could not be sent. Please try again.");
    }
  }

  return (
    <section className="vc-apply-section" id="apply" ref={sectionRef} hidden={!shown} aria-labelledby="vc-form-title">
      <div className="bx-wrap vc-form-grid">
        <aside className="vc-form-intro">
          <h2 id="vc-form-title">{vacancy ? "Apply for this position" : "Send a general application"}</h2>
          <p>Fill in your details and attach your CV. The company reviews every application and contacts shortlisted candidates.</p>
          <div className="vc-chosen">
            <span>Applying for</span>
            <strong>{vacancy ? vacancy.title : "General application"}</strong>
            <span>{vacancy ? vacancy.company : area.title}</span>
          </div>
          <div className="vc-ready">
            <h3>Have these ready</h3>
            <ul>
              <li>Your CV as a PDF, Word, JPG or PNG file, up to 5 MB</li>
              <li>An email address and phone number we can reach you on</li>
              <li>Your highest education and years of experience</li>
            </ul>
          </div>
        </aside>

        {status === "sent" ? (
          <div className="vc-success" role="status">
            <span className="vc-success-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m5 12.5 4.5 4.5L19 7.5" /></svg></span>
            <h3>Application sent</h3>
            <p>Thank you. Your application{vacancy ? ` for ${vacancy.title}` : ""} has been received. The company will contact you if you are shortlisted.</p>
            {reference && <p>Your reference number is <strong>{reference}</strong>. Please quote it if you contact us about this application.</p>}
            <button className="bx-button" type="button" onClick={() => setStatus("idle")}>Send another application</button>
          </div>
        ) : (
          <form className="vc-form" onSubmit={submit}>
            <input type="hidden" name="vacancyId" value={vacancyId} />

            <fieldset className="vc-group">
              <GroupTitle icon="person">Personal details</GroupTitle>
              <div className="vc-field vc-field-wide">
                <label htmlFor="vc-full-name">Full name</label>
                <input id="vc-full-name" name="fullName" autoComplete="name" required minLength={2} maxLength={120} placeholder="As it appears on your documents" />
              </div>
              <div className="vc-field">
                <label htmlFor="vc-email">Email</label>
                <input id="vc-email" name="email" type="email" autoComplete="email" required maxLength={200} placeholder="you@example.com" />
              </div>
              <div className="vc-field">
                <label htmlFor="vc-phone">Phone</label>
                <input id="vc-phone" name="phone" type="tel" autoComplete="tel" required pattern="[+0-9][0-9 \-]{6,19}" placeholder="98XXXXXXXX" />
              </div>
              <div className="vc-field">
                <label htmlFor="vc-age">Age</label>
                <input id="vc-age" name="age" type="number" inputMode="numeric" min={16} max={80} required placeholder="e.g. 26" />
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
              <GroupTitle icon="cap">Qualifications</GroupTitle>
              <div className="vc-field">
                <label htmlFor="vc-education">Highest education</label>
                <select id="vc-education" name="education" defaultValue="" required>
                  <option value="" disabled>Choose one</option>
                  {educationLevels.map((level) => <option key={level}>{level}</option>)}
                </select>
              </div>
              <div className="vc-field">
                <label htmlFor="vc-experience">Years of experience</label>
                <input id="vc-experience" name="experienceYears" type="number" inputMode="decimal" min={0} max={60} step={0.5} required placeholder="e.g. 2" />
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
              <GroupTitle icon="file">Your CV</GroupTitle>
              <div className="vc-field vc-field-wide">
                <span className="vc-label" id="vc-cv-label">Upload CV</span>
                <div
                  className={`vc-drop${dragging ? " is-dragging" : ""}${cvFile ? " has-file" : ""}${cvError ? " has-error" : ""}`}
                  onDragEnter={() => setDragging(true)}
                  onDragLeave={() => setDragging(false)}
                  onDrop={onDrop}
                >
                  <input
                    ref={cvInputRef}
                    id="vc-cv"
                    name="cv"
                    type="file"
                    accept={cvAccept}
                    required
                    aria-labelledby="vc-cv-label"
                    aria-describedby="vc-cv-hint"
                    onChange={onCvChange}
                  />
                  {cvFile ? (
                    <div className="vc-drop-file">
                      <span className="vc-drop-icon" aria-hidden="true"><svg viewBox="0 0 24 24">{groupIcons.file}</svg></span>
                      <span className="vc-drop-name">
                        <strong>{cvFile.name}</strong>
                        <small>{formatSize(cvFile.size)}</small>
                      </span>
                      <button type="button" className="vc-drop-remove" onClick={clearCv}>Remove</button>
                    </div>
                  ) : (
                    <div className="vc-drop-empty" aria-hidden="true">
                      <span className="vc-drop-icon"><svg viewBox="0 0 24 24"><path d="M12 16V4m0 0-4 4m4-4 4 4M5 16v3a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-3" /></svg></span>
                      <strong>Click to upload or drag your CV here</strong>
                      <small>PDF, Word, JPG or PNG, up to 5 MB</small>
                    </div>
                  )}
                </div>
                <p className="visually-hidden" id="vc-cv-hint">PDF, Word, JPG or PNG, 5 MB or smaller.</p>
                {cvError && <p className="vc-field-error" role="alert">{cvError}</p>}
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
  );
}
