// Pure email rendering (no I/O). Every value from the payload is HTML-escaped.

export type EmailTemplate =
  | "user-invite"
  | "password-reset"
  | "password-changed"
  | "application-received"
  | "application-new";

type Payload = Record<string, unknown>;

export function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const str = (payload: Payload, key: string) => (typeof payload[key] === "string" ? (payload[key] as string) : "");

// Links must be http(s); anything else is dropped rather than rendered.
const safeLink = (value: string) => (/^https?:\/\//i.test(value) ? value : "");

type Block = { text: string } | { button: string; href: string } | { rows: [string, string][] };

function layout(title: string, blocks: Block[]) {
  const html = blocks
    .map((block) => {
      if ("text" in block) return `<p style="margin:0 0 16px;line-height:1.6">${escapeHtml(block.text)}</p>`;
      if ("button" in block) {
        return block.href
          ? `<p style="margin:24px 0"><a href="${escapeHtml(block.href)}" style="background:#3a7020;color:#ffffff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600">${escapeHtml(block.button)}</a></p>`
          : "";
      }
      return `<table style="border-collapse:collapse;margin:0 0 16px">${block.rows
        .map(([k, v]) => `<tr><td style="padding:4px 16px 4px 0;color:#555">${escapeHtml(k)}</td><td style="padding:4px 0"><strong>${escapeHtml(v)}</strong></td></tr>`)
        .join("")}</table>`;
    })
    .join("");
  const text = blocks
    .map((block) => ("text" in block ? block.text : "button" in block ? (block.href ? `${block.button}: ${block.href}` : "") : block.rows.map(([k, v]) => `${k}: ${v}`).join("\n")))
    .filter(Boolean)
    .join("\n\n");
  return {
    html: `<!doctype html><html><body style="margin:0;background:#f4f6f2;font-family:Arial,Helvetica,sans-serif;color:#1d2a16"><div style="max-width:560px;margin:0 auto;padding:32px 24px"><div style="background:#ffffff;border-radius:12px;padding:32px"><h1 style="font-size:20px;margin:0 0 20px">${escapeHtml(title)}</h1>${html}</div><p style="font-size:12px;color:#777;margin:16px 0 0;text-align:center">Sanjeevani Group of Companies</p></div></body></html>`,
    text: `${title}\n\n${text}\n\n— Sanjeevani Group of Companies`,
  };
}

export function renderEmail(template: EmailTemplate, payload: Payload): { html: string; text: string } {
  const name = str(payload, "name") || "there";
  switch (template) {
    case "user-invite":
      return layout("You have been invited to the Sanjeevani Group admin", [
        { text: `Hello ${name},` },
        { text: "An administrator has created an account for you. Choose a password to activate it." },
        { button: "Set your password", href: safeLink(str(payload, "link")) },
        { text: "This link can be used once and expires in 3 days. If you were not expecting this, you can ignore this email." },
      ]);
    case "password-reset":
      return layout("Reset your password", [
        { text: `Hello ${name},` },
        { text: "Someone asked to reset the password for your Sanjeevani Group admin account." },
        { button: "Choose a new password", href: safeLink(str(payload, "link")) },
        { text: "This link can be used once and expires in 1 hour. If you did not ask for this, ignore this email; your password stays the same." },
      ]);
    case "password-changed":
      return layout("Your password was changed", [
        { text: `Hello ${name},` },
        { text: "The password for your Sanjeevani Group admin account was just changed, and other devices were signed out." },
        { text: "If this was not you, contact your administrator immediately." },
      ]);
    case "application-received":
      return layout("We have received your application", [
        { text: `Dear ${name},` },
        { text: `Thank you for applying for ${str(payload, "vacancyTitle")} at ${str(payload, "companyName")}.` },
        { rows: [["Reference number", str(payload, "referenceNumber")], ["Submitted", str(payload, "submittedAt")]] },
        { text: "Our team will review your application. If you are shortlisted, we will contact you by phone or email. Please quote your reference number in any message to us." },
      ]);
    case "application-new":
      return layout("New job application", [
        { rows: [
          ["Position", str(payload, "vacancyTitle")],
          ["Company", str(payload, "companyName")],
          ["Applicant", name],
          ["Reference", str(payload, "referenceNumber")],
          ["Submitted", str(payload, "submittedAt")],
        ] },
        { button: "Open in the admin", href: safeLink(str(payload, "link")) },
        { text: "The CV and contact details are only available in the admin, not in this email." },
      ]);
  }
}
