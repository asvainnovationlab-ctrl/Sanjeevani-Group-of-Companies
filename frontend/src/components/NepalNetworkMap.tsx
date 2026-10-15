import Image from "next/image";
import { locationPins } from "@/data/locationPins";

export default function NepalNetworkMap({ connected = false }: { connected?: boolean }) {
  const hub = locationPins.find((pin) => pin.city === "Kathmandu");

  return (
    <div
      className={`nepal-map${connected ? " nepal-map-connected" : ""}`}
      role="group"
      aria-label="Example locations in Nepal. Select a city to open it in Google Maps."
    >
      <Image className="nepal-map-shape" src="/nepal-outline.svg" alt="" width={700} height={300} priority={connected} />
      {connected && hub && (
        <svg className="nepal-map-connections" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          {locationPins.filter((pin) => pin.city !== hub.city).map((pin) => {
            const controlX = (hub.x + pin.x) / 2;
            const controlY = Math.min(hub.y, pin.y) - 13;
            return (
              <path
                key={pin.city}
                d={`M ${hub.x} ${hub.y} Q ${controlX} ${controlY} ${pin.x} ${pin.y}`}
              />
            );
          })}
        </svg>
      )}
      {locationPins.map((pin) => (
        <a
          key={pin.city}
          className={`nepal-map-pin${connected && pin.city === "Kathmandu" ? " is-hub" : ""}`}
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
