"use client";

import Image from "next/image";
import { type KeyboardEvent, type ReactNode, useEffect, useRef, useState } from "react";
import { galleryPhotos, galleryVideos, getYouTubeId } from "@/data/newsroom";

type Tab = "photos" | "videos";

// The Newsroom gallery: a Photos / Videos tab switch, a photo grid that opens
// a full-screen viewer, and a video grid. `renderYouTube` is the Newsroom's
// own click-to-play YouTube player, so both sections behave the same.
export default function NewsroomGallery({ renderYouTube }: { renderYouTube: (id: string, title: string, thumbnail?: string) => ReactNode }) {
  const [tab, setTab] = useState<Tab>("photos");
  const [open, setOpen] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const lastTrigger = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open !== null && !dialog.open) dialog.showModal();
    if (open === null && dialog.open) dialog.close();
  }, [open]);

  function step(delta: number) {
    setOpen((current) => (current === null ? current : (current + delta + galleryPhotos.length) % galleryPhotos.length));
  }

  function onTabKey(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const next: Tab = tab === "photos" ? "videos" : "photos";
    setTab(next);
    document.getElementById(`gallery-tab-${next}`)?.focus();
  }

  const photo = open === null ? null : galleryPhotos[open];

  // Every fifth photo spans two columns; the last one does too when that is what
  // it takes to fill the final row of the 3-column grid.
  const baseWide = (index: number) => index % 5 === 0;
  const wideCount = galleryPhotos.filter((_, index) => baseWide(index)).length;
  const isWide = (index: number) =>
    baseWide(index) || (index === galleryPhotos.length - 1 && (galleryPhotos.length + wideCount) % 3 !== 0);

  return (
    <section className="newsroom-group nr-gallery" id="gallery" aria-labelledby="gallery-title">
      <div className="newsroom-group-heading">
        <h2 id="gallery-title">Gallery</h2>
        <div className="nr-tabs" role="tablist" aria-label="Gallery type">
          {(["photos", "videos"] as const).map((value) => (
            <button
              key={value}
              id={`gallery-tab-${value}`}
              type="button"
              role="tab"
              aria-selected={tab === value}
              aria-controls={`gallery-panel-${value}`}
              tabIndex={tab === value ? 0 : -1}
              onClick={() => setTab(value)}
              onKeyDown={onTabKey}
            >
              {value === "photos" ? "Photos" : "Videos"}
              <span className="num">{value === "photos" ? galleryPhotos.length : galleryVideos.length}</span>
            </button>
          ))}
        </div>
      </div>

      <div id="gallery-panel-photos" role="tabpanel" aria-labelledby="gallery-tab-photos" hidden={tab !== "photos"}>
        {galleryPhotos.length ? (
          <ul className="nr-photos">
            {galleryPhotos.map((item, index) => (
              <li key={`${item.src}-${index}`} className={isWide(index) ? "is-wide" : undefined}>
                <button
                  type="button"
                  className="nr-photo"
                  onClick={(event) => { lastTrigger.current = event.currentTarget; setOpen(index); }}
                  aria-label={`Open photo: ${item.caption}`}
                >
                  <Image src={item.src} alt={item.alt} fill sizes="(max-width: 640px) 100vw, (max-width: 1050px) 50vw, 33vw" />
                  <span className="nr-photo-caption">{item.caption}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="newsroom-empty">Photos from across the group will appear here soon.</p>
        )}
      </div>

      <div id="gallery-panel-videos" role="tabpanel" aria-labelledby="gallery-tab-videos" hidden={tab !== "videos"}>
        {galleryVideos.length ? (
          <ul className="nr-videos">
            {galleryVideos.map((video, index) => {
              if (video.kind === "file") {
                return (
                  <li key={`${video.src}-${index}`}>
                    <div className="nr-video">
                      <video controls preload="metadata" poster={video.poster}>
                        <source src={video.src} />
                      </video>
                    </div>
                    <p className="nr-video-title">{video.title}</p>
                  </li>
                );
              }
              const id = getYouTubeId(video.url);
              if (!id) return null;
              return (
                <li key={`${id}-${index}`}>
                  <div className="nr-video newsroom-video">{renderYouTube(id, video.title, video.thumbnail)}</div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="newsroom-empty">Videos from across the group will appear here soon.</p>
        )}
      </div>

      <dialog
        ref={dialogRef}
        className="nr-viewer"
        aria-label="Photo viewer"
        onClose={() => { setOpen(null); lastTrigger.current?.focus(); }}
        onClick={(event) => { if (event.target === event.currentTarget) setOpen(null); }}
        onKeyDown={(event) => {
          if (event.key === "ArrowRight") step(1);
          if (event.key === "ArrowLeft") step(-1);
        }}
      >
        {photo && (
          <figure className="nr-viewer-figure">
            <div className="nr-viewer-image">
              <Image src={photo.src} alt={photo.alt} fill sizes="90vw" />
            </div>
            <figcaption>
              <span>{photo.caption}</span>
              <span className="num">{(open ?? 0) + 1} / {galleryPhotos.length}</span>
            </figcaption>
          </figure>
        )}
        <button className="nr-viewer-close" type="button" onClick={() => setOpen(null)} aria-label="Close photo viewer">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
        </button>
        <button className="nr-viewer-nav is-prev" type="button" onClick={() => step(-1)} aria-label="Previous photo">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 5-7 7 7 7" /></svg>
        </button>
        <button className="nr-viewer-nav is-next" type="button" onClick={() => step(1)} aria-label="Next photo">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7" /></svg>
        </button>
      </dialog>
    </section>
  );
}
