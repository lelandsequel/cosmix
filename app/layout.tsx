import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import Nav from "./components/Nav";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "COSMIX — Intelligent Mixology",
  description: "COSMIC-powered cocktail recommendations tailored to your mood, moment, and palate.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${jakarta.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-[var(--font-jakarta)]">
        <Nav />
        <main className="flex-1 pt-16">{children}</main>
      </body>
    </html>
  );
}
