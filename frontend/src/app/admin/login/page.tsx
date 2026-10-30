import type { Metadata } from "next";
import { AdminLogin } from "@/components/admin/AdminConsole";

export const metadata: Metadata = { title: "Sign in | Sanjeevani Group" };

export default function LoginPage() {
  return <AdminLogin />;
}
