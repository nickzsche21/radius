import type { Metadata } from "next";
import { Instrument_Serif, Inter } from "next/font/google";
import "./globals.css";

const display = Instrument_Serif({ subsets: ["latin"], weight: "400", variable: "--font-display" });
const grotesk = Inter({ subsets: ["latin"], variable: "--font-grotesk" });

const title = "RADIUS — how far apart are your copies, really?";
const description =
  "AWS puts availability zones up to 100 km apart. Multi-AZ is not multi-region. Plot where your backups actually live and see the single event that reaches every one of them.";

export const metadata: Metadata = {
  title,
  description,
  keywords: ["backups", "disaster recovery", "3-2-1", "multi-region", "availability zone", "blast radius"],
  openGraph: { title, description, type: "website" },
  twitter: { card: "summary_large_image", title, description },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${grotesk.variable}`}>
      <body>{children}</body>
    </html>
  );
}
