"use client";

import Image from "next/image";
import Link from "next/link";
import GroupEmblem from "@/components/GroupEmblem";
import { businessGroups, type Business } from "@/data/businesses";
import { getBusinessLogo } from "@/data/businessLogos";
import { getCompanyProfile, getCompanySlug, sectorImages, toWebsiteUrl } from "@/data/companyProfiles";

const groupEmail = "info@sanjeevanigroup.com";

// The profile ("small CV") page for one company: /businesses/<slug>.
// Everything shown comes from data/businesses.ts (or the admin directory via
// /api/businesses) and data/companyProfiles.ts; empty fields are left out.
export default function CompanyProfile({ slug, businesses }: { slug: string; businesses: Business[] }) {
  const business = businesses.find((item) => getCompanySlug(item.name) === slug);

  if (!business) {
    return (
      <section className="cx-missing">
        <div className="bx-wrap">
          <h1>Company not found</h1>
          <p className="bx-lead">This company is not in the Sanjeevani Group directory.</p>
          <Link className="bx-button" href="/businesses">See all companies</Link>
        </div>
      </section>
    );
  }

  const group = businessGroups.find((item) => item.matches(business));
  const profile = getCompanyProfile(business.name);
  const logo = getBusinessLogo(business.name);
  const websiteUrl = toWebsiteUrl(business.website);
  const photo = profile?.photo || (group ? sectorImages[group.value] : "") || "/business/business.png";
  const location = business.location || "Nepal";
  const established = profile?.established;
  const email = profile?.email || groupEmail;
  const siblings = (group ? businesses.filter(group.matches) : []).filter((item) => item._id !== business._id);
  const related = (siblings.length ? siblings : businesses.filter((item) => item._id !== business._id)).slice(0, 3);

  return (
    <>
      <section className="cx-hero" aria-labelledby="cx-name">
        <Image className="cx-hero-photo" src={photo} alt="" fill priority sizes="100vw" />
        {/* Same tag-and-statement treatment as the Businesses page hero. */}
        <div className="reference-wrap cx-hero-copy">
          <div className="mission-hero-copy">
            <h1 id="cx-name" className="mission-hero-tag">{business.name}</h1>
            <p className="mission-hero-text">
              {business.name} is part of Sanjeevani Group&rsquo;s {group ? group.label.toLowerCase() : business.sector.toLowerCase()} businesses, based in {location}. {business.description}
            </p>
          </div>
        </div>
      </section>

      <section className="cx-overview" aria-labelledby="cx-overview-title">
        <div className="bx-wrap cx-overview-grid">
          <div className="cx-overview-copy">
            <span className="cx-logo" aria-hidden="true">
              {logo ? (
                <Image src={logo} alt="" fill sizes="96px" />
              ) : (
                <strong>{business.name.split(/\s+/).map((word) => word[0]).slice(0, 2).join("").toUpperCase()}</strong>
              )}
            </span>
            <h2 id="cx-overview-title">Overview</h2>
            <p className="bx-lead">{business.description}</p>
          </div>
          <dl className="cx-facts">
            <div><dt>Sector</dt><dd>{business.sector}</dd></div>
            {group && <div><dt>Part of</dt><dd><Link href={`/businesses?group=${group.value}`}>{group.label}</Link></dd></div>}
            <div><dt>Location</dt><dd>{profile?.address || location}</dd></div>
            {established && <div><dt>Established</dt><dd className="num">{established}</dd></div>}
            <div>
              <dt>Website</dt>
              <dd>{websiteUrl ? <a href={websiteUrl} target="_blank" rel="noreferrer">{websiteUrl.replace(/^https?:\/\//, "").replace(/\/$/, "")}</a> : "Coming soon"}</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="cx-leaders" aria-labelledby="cx-leaders-title">
        <div className="bx-wrap">
          <h2 id="cx-leaders-title">Leadership</h2>
          <div className="cx-leader-grid">
            {/* Both cards follow the Leadership page's chairman panel: green
                panel, portrait rising out of its top edge, emblem watermark. */}
            <article className="cx-leader">
              <div className="cx-leader-photo">
                <Image src="/chairman.png" alt="C.A. Khuma Parsad Aryal" fill sizes="(max-width: 780px) 70vw, 300px" />
              </div>
              <div className="cx-leader-copy">
                <h3>C.A. Khuma Parsad Aryal</h3>
                <p className="cx-leader-role">Chairman</p>
                <p className="cx-leader-org">Sanjeevani Group</p>
                <Link className="cx-leader-link" href="/chairman">View details</Link>
              </div>
              <span className="cx-leader-mark" aria-hidden="true"><GroupEmblem /></span>
            </article>
            <article className="cx-leader">
              <div className="cx-leader-photo">
                {/* PLACEHOLDER: the chairman's portrait stands in until
                    managingDirectorPhoto is set in data/companyProfiles.ts. */}
                <Image src={profile?.managingDirectorPhoto || "/chairman.png"} alt={profile?.managingDirector || "Managing director"} fill sizes="(max-width: 780px) 70vw, 300px" />
              </div>
              <div className="cx-leader-copy">
                <h3>{profile?.managingDirector || "To be announced"}</h3>
                <p className="cx-leader-role">Managing Director</p>
                <p className="cx-leader-org">{business.name}</p>
              </div>
              <span className="cx-leader-mark" aria-hidden="true"><GroupEmblem /></span>
            </article>
          </div>
        </div>
      </section>

      <section className="cx-contact" aria-labelledby="cx-contact-title">
        <div className="bx-wrap cx-contact-grid">
          <h2 id="cx-contact-title">Get in touch</h2>
          <dl className="cx-contact-list">
            <div><dt>Email</dt><dd><a href={`mailto:${email}`}>{email}</a></dd></div>
            {profile?.phone && <div><dt>Phone</dt><dd><a href={`tel:${profile.phone.replace(/\s+/g, "")}`}>{profile.phone}</a></dd></div>}
            <div><dt>Address</dt><dd>{profile?.address || location}</dd></div>
            {websiteUrl && <div><dt>Website</dt><dd><a href={websiteUrl} target="_blank" rel="noreferrer">{websiteUrl.replace(/^https?:\/\//, "").replace(/\/$/, "")}</a></dd></div>}
          </dl>
        </div>
      </section>

      {related.length > 0 && (
        <section className="cx-related" aria-labelledby="cx-related-title">
          <div className="bx-wrap">
            <h2 id="cx-related-title">{siblings.length ? `More in ${group?.label.toLowerCase()}` : "More Sanjeevani companies"}</h2>
            <ul className="cx-related-list">
              {related.map((item) => {
                const itemGroup = businessGroups.find((entry) => entry.matches(item));
                const itemPhoto = getCompanyProfile(item.name)?.photo || (itemGroup ? sectorImages[itemGroup.value] : "/business/business.png");
                return (
                  <li key={item._id}>
                    <Link className="cx-related-card" href={`/businesses/${getCompanySlug(item.name)}`}>
                      <span className="cx-related-photo"><Image src={itemPhoto} alt="" fill sizes="(max-width: 780px) 90vw, 360px" /></span>
                      <strong>{item.name}</strong>
                      <span>{item.location || item.sector}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      )}
    </>
  );
}
