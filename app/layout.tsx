import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { PwaRegister } from "@/components/PwaRegister";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "World Cup Squads 2026",
  description:
    "Projected 2026 World Cup squads using qualification and recent friendly selection trends.",
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="min-h-full font-sans">
        <PwaRegister />
        <header className="border-b border-slate-200 bg-white">
          <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
            <Link href="/" className="text-sm font-semibold text-brand-700">
              World Cup Squads
            </Link>
            <div className="flex items-center gap-4 text-sm">
              <Link href="/groups" className="text-slate-700 hover:text-slate-900">
                Groups
              </Link>
              <Link href="/teams" className="text-slate-700 hover:text-slate-900">
                Teams
              </Link>
              <Link href="/coverage" className="text-slate-700 hover:text-slate-900">
                Coverage
              </Link>
              <Link href="/methodology" className="text-slate-700 hover:text-slate-900">
                Methodology
              </Link>
            </div>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
