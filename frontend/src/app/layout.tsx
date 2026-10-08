import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sanjeevani Group of Companies | One horizon, many ambitions",
  description:
    "Discover Sanjeevani Group and its businesses across healthcare, education, agriculture, infrastructure, and more.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-body">{children}</body>
    </html>
  );
}
