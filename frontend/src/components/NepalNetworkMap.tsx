"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { locationPins } from "@/data/locationPins";

export default function NepalNetworkMap({ connected = false, drawOnScroll = false }: { connected?: boolean; drawOnScroll?: boolean }) {
  const hub = locationPins.find((pin) => pin.city === "Kathmandu");
  const mapRef = useRef<HTMLDivElement>(null);
  const [drawn, setDrawn] = useState(false);
  const showConnections = connected || drawOnScroll;

  useEffect(() => {
    if (!drawOnScroll) return;
    const map = mapRef.current;
    if (!map || !("IntersectionObserver" in window)) {
      setDrawn(true);
      return;
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      setDrawn(true);
      observer.disconnect();
    }, { threshold: 0.45 });

    observer.observe(map);
    return () => observer.disconnect();
  }, [drawOnScroll]);

  return (
    <div
      ref={mapRef}
      className={`nepal-map${showConnections ? " nepal-map-connected" : ""}${drawOnScroll ? " nepal-map-draw" : ""}${drawn ? " is-drawn" : ""}`}
      role="group"
      aria-label="Example locations in Nepal. Select a city to open it in Google Maps."
    >
      <Image className="nepal-map-shape" src="/nepal-outline.svg" alt="" width={700} height={300} priority={connected} />
      {showConnections && hub && (
        <svg className="nepal-map-connections" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          {locationPins.filter((pin) => pin.city !== hub.city).map((pin) => {
            const controlX = (hub.x + pin.x) / 2;
            const controlY = Math.min(hub.y, pin.y) - 13;
            const d = `M ${hub.x} ${hub.y} Q ${controlX} ${controlY} ${pin.x} ${pin.y}`;
            return drawOnScroll ? (
              <g key={pin.city}>
                <path className="nepal-map-line" d={d} pathLength={1} />
                <path className="nepal-map-flow" d={d} pathLength={1} />
              </g>
            ) : (
              <path key={pin.city} d={d} />
            );
          })}
        </svg>
      )}
      {locationPins.map((pin) => (
        <a
          key={pin.city}
          className={`nepal-map-pin${showConnections && pin.city === "Kathmandu" ? " is-hub" : ""}`}
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${pin.city}, Nepal`)}`}
          target="_blank"
          rel="noreferrer"
          aria-label={`Open ${pin.city}, Nepal in Google Maps`}
          style={{ left: `${pin.x}%`, top: `${pin.y}%`, animationDelay: pin.delay }}
          data-label-position={pin.label}
        >
          <span className="nepal-map-pin-dot" aria-hidden="true" />
          <span className="nepal-map-pin-label">{pin.city}</span>
        </a>
      ))}
    </div>
  );
}
