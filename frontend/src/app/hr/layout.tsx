import type { Metadata } from "next";
import "../admin/admin.css";

export const metadata: Metadata = {
  title: "HR | Sanjeevani Group",
  robots: { index: false, follow: false },
};

export default function HrLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
