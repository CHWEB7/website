import type { Metadata } from "next";
import { Outfit, Syne } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Voltron Digital — Web products, built with intent",
  description:
    "Personal site for Voltron Digital: marketing sites, applications, and media systems — from first sketch to production deploy.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${syne.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-base text-ink">{children}</body>
    </html>
  );
}
