import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/ui/navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PFL - Fantasy Football League History",
  description: "PFL Fantasy Football League history since 2004. Championships, stats, records, and rivalries.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Navbar />
        <main className="min-h-screen">
          {children}
        </main>
        <footer className="border-t border-bg-tertiary bg-bg-secondary py-8 mt-16">
          <div className="container mx-auto px-4 text-center text-text-muted text-sm">
            <p>PFL - Fantasy Football - Est. 2004</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
