import type { Metadata } from "next";
import "./globals.css";
import Navbar from "./components/Navbar";

export const metadata: Metadata = {
  title: "Innovate Grade Master 2.0 - Competition Scoring Platform",
  description: "Innovate Grade Master 2.0 is an automated web platform for competition scoring, live leaderboard updates, and judge management.",
  keywords: ["Innovate Grade Master", "Grade Master 2.0", "Competition Scoring", "Leaderboard System"],
  verification: {
    google: "EDcxpCiHH7fg82YMKzRhomRd6hG3L33DH4g9WbwxapQ",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
      </head>
      <body className="antialiased bg-slate-50 text-slate-900 min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow w-full overflow-x-hidden">
          {children}
        </main>
      </body>
    </html>
  );
}