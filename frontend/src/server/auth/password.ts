import { hash, verify } from "@node-rs/argon2";

// Argon2id (algorithm 2) at the OWASP-recommended baseline: 19 MiB memory,
// 2 iterations, 1 lane.
const ARGON2 = { algorithm: 2, memoryCost: 19456, timeCost: 2, parallelism: 1 } as const;

export const PASSWORD_MIN_LENGTH = 12;
export const PASSWORD_MAX_LENGTH = 128;

export function hashPassword(password: string): Promise<string> {
  return hash(password, ARGON2);
}

export async function verifyPassword(passwordHash: string, password: string): Promise<boolean> {
  try {
    return await verify(passwordHash, password);
  } catch {
    return false;
  }
}

// Verifying against a fixed hash when the account does not exist keeps the
// response time the same, so attackers cannot probe which emails have accounts.
let dummyHash: Promise<string> | undefined;
export async function verifyAgainstDummy(password: string): Promise<false> {
  dummyHash ??= hashPassword("dummy-password-for-timing-only");
  await verifyPassword(await dummyHash, password);
  return false;
}

// Returns a reason the password is unacceptable, or null when it is fine.
export function passwordProblem(password: string, email?: string): string | null {
  if (password.length < PASSWORD_MIN_LENGTH) return `Use at least ${PASSWORD_MIN_LENGTH} characters.`;
  if (password.length > PASSWORD_MAX_LENGTH) return `Use at most ${PASSWORD_MAX_LENGTH} characters.`;
  if (/^(.)\1+$/.test(password)) return "Do not repeat a single character.";
  const local = email?.split("@")[0]?.toLowerCase();
  if (local && local.length >= 4 && password.toLowerCase().includes(local)) return "Do not include your email name in the password.";
  const common = ["password", "123456789012", "qwertyuiop", "sanjeevani"];
  if (common.some((word) => password.toLowerCase().includes(word))) return "Choose a less common password.";
  return null;
}
