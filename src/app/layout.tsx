import type { Metadata } from "next";
import { Space_Grotesk, Space_Mono } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  variable: "--font-data",
  weight: ["400", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Recruiter-X — AI Hiring Intelligence Platform",
  description:
    "The AI intelligence layer that interrogates resumes, benchmarks against the ideal, and delivers ranked shortlists with surgical interview questions. Surface truth. Silence noise.",
  keywords: [
    "AI recruitment",
    "hiring intelligence",
    "resume analysis",
    "candidate ranking",
    "interview questions",
    "ghost candidate",
    "BYOK",
  ],
  openGraph: {
    title: "Recruiter-X — AI Hiring Intelligence Platform",
    description:
      "Surface the truth in every applicant pool. AI-powered candidate analysis, ranking, and interrogation questions.",
    type: "website",
  },
};

import { Toaster } from "sonner";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${spaceMono.variable}`}>
      <body className="font-body antialiased text-neutral-800">
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
