import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Providers } from "@/components/providers";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: {
    default: "AquaBotAI - AI-Powered Aquarium Management",
    template: "%s | AquaBotAI",
  },
  description:
    "Your intelligent aquarium companion. Track water parameters, manage livestock, get AI-powered care advice, and never miss a maintenance task.",
  keywords: [
    "aquarium",
    "fish tank",
    "aquarium management",
    "water parameters",
    "fish care",
    "AI aquarium",
    "aquarium app",
  ],
  authors: [{ name: "AquaBotAI" }],
  creator: "AquaBotAI",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "AquaBotAI",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "AquaBotAI",
    title: "AquaBotAI - AI-Powered Aquarium Management",
    description:
      "Your intelligent aquarium companion. Track water parameters, manage livestock, get AI-powered care advice.",
  },
  twitter: {
    card: "summary_large_image",
    title: "AquaBotAI - AI-Powered Aquarium Management",
    description:
      "Your intelligent aquarium companion. Track water parameters, manage livestock, get AI-powered care advice.",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#00B4D8" }, // brand-cyan
    { media: "(prefers-color-scheme: dark)", color: "#0A2540" },   // brand-navy
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover", // Enable iOS safe area insets
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
