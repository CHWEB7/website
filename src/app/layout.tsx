import type { Metadata } from "next";
import "@fontsource/google-sans/latin-400.css";
import "@fontsource/google-sans/latin-500.css";
import "@fontsource/google-sans/latin-600.css";
import "@fontsource/google-sans/latin-700.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Voltron Digital — Web products, built with intent",
  description:
    "Personal site for Voltron Digital: marketing sites, applications, and media systems — from first sketch to production deploy.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-base font-sans text-ink">{children}</body>
    </html>
  );
}
