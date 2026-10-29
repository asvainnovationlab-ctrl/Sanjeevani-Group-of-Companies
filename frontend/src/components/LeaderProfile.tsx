import Image from "next/image";
import Link from "next/link";
import GroupEmblem from "@/components/GroupEmblem";
import type { ReactNode } from "react";
import { allLeaders, getLeader, getLeaderProfile, leaderHref } from "@/data/leaders";

// A leader's profile page: /leadership/<slug>. Portrait hero, their message,
// and a short CV. Anything not yet written shows as an "[Add …]" placeholder
// (see data/leaders.ts).
export default function LeaderProfile({ slug, socials }: { slug: string; socials: (name: string, socials: Parameters<typeof getLeaderProfile>[0]["socials"]) => ReactNode }) {
  const leader = getLeader(slug);

  if (!leader || leader.slug === "chairman") {
    return (
      <section className="ld-missing">
        <div className="bx-wrap">
          <h1>Profile not found</h1>
          <p className="bx-lead">This person is not on the Sanjeevani Group leadership page.</p>
          <Link className="bx-button" href="/leadership">See our leadership</Link>
        </div>
      </section>
    );
  }

  const profile = getLeaderProfile(leader);
  const others = allLeaders.filter((item) => item.slug !== leader.slug).slice(0, 3);

  return (
    <>
      <section className="ld-hero" aria-labelledby="ld-name">
        <span className="ld-hero-mark" aria-hidden="true"><GroupEmblem /></span>
        <div className="bx-wrap ld-hero-grid">
          <div className="ld-hero-copy">
            <p className="ld-hero-role">{leader.role}, Sanjeevani Group</p>
            <h1 id="ld-name">{leader.name}</h1>
            <p className="ld-hero-summary">{profile.summary}</p>
            <div className="ld-actions">
              <a className="ld-hero-button" href="#message">Read the message</a>
              {socials(leader.name, leader.socials)}
            </div>
          </div>
          <div className="ld-portrait">
            <span className="ld-portrait-outline" aria-hidden="true" />
            <div className="ld-portrait-frame">
              <Image src={leader.photo} alt={`Portrait of ${leader.name}`} fill priority sizes="(max-width: 960px) 80vw, 460px" />
            </div>
            <div className="ld-portrait-caption">
              <strong>{leader.name}</strong>
              <span>{leader.role}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="ld-message" id="message" aria-labelledby="ld-message-title">
        <div className="bx-wrap ld-message-grid">
          <h2 id="ld-message-title">A message from {leader.name === "Leader Name" ? "our leadership" : leader.name}</h2>
          <div className="ld-letter">
            {profile.message.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
            <p className="ld-signature">
              <strong>{leader.name}</strong>
              <span>{leader.role}, Sanjeevani Group</span>
            </p>
          </div>
        </div>
      </section>

      <section className="ld-cv" aria-labelledby="ld-cv-title">
        <div className="bx-wrap">
          <h2 id="ld-cv-title">Profile</h2>
          <div className="ld-cv-grid">
            <div>
              <h3>Career</h3>
              <ol className="ld-timeline">
                {profile.career.map((entry, index) => (
                  <li key={index}>
                    <span className="ld-period">{entry.period}</span>
                    <div>
                      <strong>{entry.position}</strong>
                      <span>{entry.organisation}</span>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
            <div className="ld-cv-side">
              <div>
                <h3>Education</h3>
                <ul className="ld-list">
                  {profile.education.map((entry, index) => (
                    <li key={index}><strong>{entry.qualification}</strong><span>{entry.institution}</span></li>
                  ))}
                </ul>
              </div>
              <div>
                <h3>Responsibilities</h3>
                <ul className="ld-list">
                  {profile.responsibilities.map((item, index) => <li key={index}><strong>{item}</strong></li>)}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="ld-more" aria-labelledby="ld-more-title">
        <div className="bx-wrap">
          <div className="ld-more-head">
            <h2 id="ld-more-title">More from our leadership</h2>
            <Link className="ld-text-link" href="/leadership">All leadership</Link>
          </div>
          <ul className="ld-more-list">
            {others.map((item) => (
              <li key={item.slug}>
                <Link className="ld-more-card" href={leaderHref(item)}>
                  <span className="ld-more-photo"><Image src={item.photo} alt="" fill sizes="(max-width: 780px) 90vw, 360px" /></span>
                  <strong>{item.name}</strong>
                  <span>{item.role}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
