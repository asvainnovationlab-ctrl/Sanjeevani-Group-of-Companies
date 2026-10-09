import Image from "next/image";

const composeUrl = "https://mail.google.com/mail/?view=cm&fs=1&to=info%40sanjeevanigroup.com";

export default function GmailContactButton() {
  return (
    <a
      className="gmail-contact-button"
      href={composeUrl}
      target="_blank"
      rel="noreferrer"
      aria-label="Email Sanjeevani Group using Gmail"
      title="Email us with Gmail"
    >
      <Image src="/gmail.webp" alt="" aria-hidden="true" width={28} height={28} />
    </a>
  );
}
