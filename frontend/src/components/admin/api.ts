// Small client for the admin API: JSON in/out, readable error messages.

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function api<T = unknown>(path: string, options: { method?: string; body?: unknown; form?: FormData } = {}): Promise<T> {
  const response = await fetch(path, {
    method: options.method ?? (options.body !== undefined || options.form ? "POST" : "GET"),
    headers: options.body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: options.form ?? (options.body !== undefined ? JSON.stringify(options.body) : undefined),
    credentials: "same-origin",
  });
  const data = (await response.json().catch(() => ({}))) as { error?: { message?: string } } & T;
  if (!response.ok) throw new ApiError(response.status, data.error?.message ?? "Something went wrong. Please try again.");
  return data;
}

export type Me = {
  user: { id: string; email: string; name: string };
  roles: string[];
  permissions: Record<string, "all" | string[]>;
};

export const hasPermission = (me: Me, key: string) => Boolean(me.permissions[key]);

export function formatDate(value: string | null | undefined, withTime = true) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kathmandu",
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  }).format(new Date(value));
}

export const label = (value: string) => value.charAt(0) + value.slice(1).toLowerCase().replace(/_/g, " ");
