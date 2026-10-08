export default function GroupEmblem() {
  return (
    <svg className="group-emblem" viewBox="0 0 160 190" role="img" aria-label="Sanjeevani Group crowned S emblem">
      <g className="emblem-laurel">
        <path d="M36 145C13 115 11 74 30 43" />
        <path d="M124 145c23-30 25-71 6-102" />
        <path d="M29 120c-12-1-20-7-22-17 11 0 19 5 22 17Zm-6-20C11 96 5 88 5 78c11 2 17 9 18 22Zm0-23C13 72 10 63 14 54c9 6 12 14 9 23Zm5-21c-8-7-10-16-5-25 8 7 10 16 5 25Zm8-19c-6-8-5-17 1-25 6 9 6 18-1 25Z" />
        <path d="M131 120c12-1 20-7 22-17-11 0-19 5-22 17Zm6-20c12-4 18-12 18-22-11 2-17 9-18 22Zm0-23c10-5 13-14 9-23-9 6-12 14-9 23Zm-5-21c8-7 10-16 5-25-8 7-10 16-5 25Zm-8-19c6-8 5-17-1-25-6 9-6 18 1 25Z" />
        <path className="laurel-stem" d="M36 145c-7-10-12-20-15-31m103 31c7-10 12-20 15-31" />
      </g>
      <g className="emblem-crown">
        <path d="m44 47 17 11 18-34 20 34 17-11-7 29H50l-6-29Z" />
        <path d="M50 82h59v8H50zM54 96h51" />
        <circle cx="44" cy="45" r="4" /><circle cx="79" cy="22" r="4" /><circle cx="117" cy="45" r="4" />
      </g>
      <text className="emblem-letter" x="80" y="146" textAnchor="middle">S</text>
      <circle className="emblem-dot" cx="80" cy="157" r="3" />
    </svg>
  );
}
