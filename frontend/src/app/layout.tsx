import type { Metadata } from "next";
import "./globals.css";
import "./businesses.css";
import "./legal.css";
import ThemeSwitcher from "@/components/ThemeSwitcher";

export const metadata: Metadata = {
  title: "Sanjeevani Group of Companies | One horizon, many ambitions",
  description:
    "Discover Sanjeevani Group and its businesses across healthcare, education, agriculture, infrastructure, and more.",
  icons: {
    icon: "/logo-emblem.png",
    shortcut: "/logo-emblem.png",
    apple: "/logo-emblem.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-body">
        <ThemeSwitcher />
        {children}
      </body>
    </html>
  );
}
