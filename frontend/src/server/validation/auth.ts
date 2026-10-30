import { z } from "zod";
import { PASSWORD_MAX_LENGTH } from "@/server/auth/password";

const email = z.string().trim().toLowerCase().email("Enter a valid email address.").max(254);
const password = z.string().min(1, "Enter your password.").max(PASSWORD_MAX_LENGTH);
const newPassword = z.string().max(PASSWORD_MAX_LENGTH); // strength checked by passwordProblem()
const token = z.string().min(20).max(200);
const membership = z.object({ roleKey: z.string().min(2).max(60), companyId: z.string().uuid().nullable() });

export const loginSchema = z.object({ email, password });
export const resetRequestSchema = z.object({ email });
export const resetConfirmSchema = z.object({ token, password: newPassword });
export const changePasswordSchema = z.object({ currentPassword: password, newPassword });

export const inviteUserSchema = z.object({
  email,
  name: z.string().trim().min(2).max(120),
  memberships: z.array(membership).max(50).default([]),
});

export const updateUserSchema = z
  .object({
    name: z.string().trim().min(2).max(120).optional(),
    status: z.enum(["ACTIVE", "SUSPENDED", "DEACTIVATED"]).optional(),
  })
  .refine((value) => value.name !== undefined || value.status !== undefined, "Nothing to update.");

export const membershipsSchema = z.object({ memberships: z.array(membership).max(50) });

export type MembershipInput = z.infer<typeof membership>;

export const changeEmailSchema = z.object({ currentPassword: password, newEmail: email });
