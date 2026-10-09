const socialLinks = [
  {
    name: "Facebook",
    href: "https://www.facebook.com/",
    icon: <path d="M13.5 21v-8h2.7l.4-3.1h-3.1v-2c0-.9.3-1.5 1.6-1.5h1.7V3.6c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3v2.1H7.3V13h2.8v8h3.4Z" />,
  },
  {
    name: "X",
    href: "https://x.com/",
    icon: <path d="M18.9 3h2.9l-6.4 7.3L23 21h-6l-4.7-6.2L6.9 21H4l6.8-7.8L3.3 3h6.2l4.2 5.7L18.9 3Zm-1 16h1.6L8.4 4.9H6.7L17.9 19Z" />,
  },
  {
    name: "YouTube",
    href: "https://www.youtube.com/",
    icon: <><path d="M23.2 7a3 3 0 0 0-2.1-2.1C19.2 4.4 12 4.4 12 4.4s-7.2 0-9.1.5A3 3 0 0 0 .8 7 31 31 0 0 0 .3 12a31 31 0 0 0 .5 5 3 3 0 0 0 2.1 2.1c1.9.5 9.1.5 9.1.5s7.2 0 9.1-.5a3 3 0 0 0 2.1-2.1 31 31 0 0 0 .5-5 31 31 0 0 0-.5-5Z" /><path className="social-icon-cutout" d="m9.7 15.5 6-3.5-6-3.5v7Z" /></>,
  },
  {
    name: "LinkedIn",
    href: "https://www.linkedin.com/",
    icon: <path d="M5.2 7.6a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM3.4 9h3.6v11H3.4V9Zm5.8 0h3.4v1.5h.1a3.7 3.7 0 0 1 3.3-1.8c3.5 0 4.1 2.3 4.1 5.2V20h-3.6v-5.4c0-1.3 0-3-1.8-3s-2.1 1.4-2.1 2.9V20H9.2V9Z" />,
  },
];

export default function SocialLinks({ className = "" }: { className?: string }) {
  return (
    <div className={`reference-social-links ${className}`.trim()} aria-label="Social media">
      {socialLinks.map(({ name, href, icon }) => (
        <a href={href} key={name} target="_blank" rel="noopener noreferrer" aria-label={`Visit ${name}`}>
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            {icon}
          </svg>
        </a>
      ))}
    </div>
  );
}
