"use client";

import { useEffect, useState } from "react";

type Application = {
  _id: string;
  vacancyTitle: string;
  company: string;
  fullName: string;
  email: string;
  phone: string;
  age: number;
  gender: string;
  address: string;
  education: string;
  experienceYears: number;
  currentEmployer: string;
  expectedSalary: string;
  coverLetter: string;
  cvFileName: string;
  cvSize: number;
  status: "new" | "reviewed";
  createdAt: string;
};

// Job applications sent from /careers/<area>, shown in the admin panel.
export default function AdminApplications() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const response = await fetch("/api/admin/applications");
        const result = (await response.json().catch(() => ({}))) as { data?: Application[]; message?: string };
        if (!response.ok) throw new Error(result.message || "Could not load applications.");
        setApplications(result.data ?? []);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Could not load applications.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  async function setStatus(application: Application, status: Application["status"]) {
    const response = await fetch(`/api/admin/applications/${application._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (response.ok) setApplications((list) => list.map((item) => (item._id === application._id ? { ...item, status } : item)));
    else setError("Could not update the application.");
  }

  const newCount = applications.filter((item) => item.status === "new").length;

  return (
    <section className="admin-content admin-applications">
      <div className="admin-list-heading">
        <div>
          <h2>Job applications</h2>
          <p>{applications.length} received · {newCount} new · Sent from the careers vacancy pages</p>
        </div>
      </div>
      {error && <p className="admin-message admin-error" role="alert">{error}</p>}
      {loading ? (
        <p className="admin-loading">Loading applications…</p>
      ) : applications.length ? (
        <div className="admin-business-list">
          {applications.map((application) => (
            <article className="admin-business-row admin-application-row" key={application._id}>
              <div className="admin-business-summary">
                <span className={`admin-status${application.status === "reviewed" ? " is-published" : ""}`}>{application.status === "reviewed" ? "Reviewed" : "New"}</span>
                <h3>{application.fullName}</h3>
                <p>{application.vacancyTitle}, {application.company}</p>
                <p>{new Date(application.createdAt).toLocaleString()} · {application.education} · {application.experienceYears} years experience</p>
                {openId === application._id && (
                  <dl className="admin-application-details">
                    <div><dt>Email</dt><dd><a href={`mailto:${application.email}`}>{application.email}</a></dd></div>
                    <div><dt>Phone</dt><dd><a href={`tel:${application.phone.replace(/\s+/g, "")}`}>{application.phone}</a></dd></div>
                    <div><dt>Age</dt><dd>{application.age}</dd></div>
                    {application.gender && <div><dt>Gender</dt><dd>{application.gender}</dd></div>}
                    <div><dt>Address</dt><dd>{application.address}</dd></div>
                    {application.currentEmployer && <div><dt>Current employer</dt><dd>{application.currentEmployer}</dd></div>}
                    {application.expectedSalary && <div><dt>Expected salary</dt><dd>{application.expectedSalary}</dd></div>}
                    {application.coverLetter && <div><dt>Cover letter</dt><dd className="admin-cover-letter">{application.coverLetter}</dd></div>}
                  </dl>
                )}
              </div>
              <div className="admin-business-actions">
                <button type="button" onClick={() => setOpenId(openId === application._id ? null : application._id)}>{openId === application._id ? "Hide details" : "Details"}</button>
                <a href={`/api/admin/applications/${application._id}`}>Download CV ({Math.max(1, Math.round(application.cvSize / 1024))} KB)</a>
                <button type="button" onClick={() => void setStatus(application, application.status === "new" ? "reviewed" : "new")}>{application.status === "new" ? "Mark reviewed" : "Mark new"}</button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="admin-empty">No applications have been received yet.</p>
      )}
    </section>
  );
}
