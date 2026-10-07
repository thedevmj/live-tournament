import type { Metadata, Viewport } from "next";
import { Archivo, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const archivo = Archivo({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-archivo",
  axes: ["wdth"],
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jetbrains",
});

export const metadata: Metadata = {
  title: {
    default: "OVERTIME — Circuit Major S04",
    template: "%s · OVERTIME",
  },
  description:
    "Live tournament control room. Every round, every angle — live from the Circuit Major, Season 04.",
  openGraph: {
    type: "website",
    title: "OVERTIME — Circuit Major S04",
    description:
      "Live tournament control room. Every round, every angle — live from the Circuit Major, Season 04.",
  },
  twitter: {
    card: "summary",
    title: "OVERTIME — Circuit Major S04",
    description:
      "Live tournament control room. Every round, every angle — live from the Circuit Major, Season 04.",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0b0d",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${archivo.variable} ${jetbrains.variable} h-full antialiased`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}