import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login to Your Aquarium Dashboard",
  description: "Sign in to your AquaBotAI account to track water parameters, manage your fish and livestock, schedule maintenance, and get AI-powered aquarium care recommendations.",
  openGraph: {
    title: "Login to Your Aquarium Dashboard | AquaBotAI",
    description: "Sign in to your AquaBotAI account to track water parameters, manage your fish and livestock, schedule maintenance, and get AI-powered aquarium care recommendations.",
    images: ["/og-image.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Login to Your Aquarium Dashboard | AquaBotAI",
    description: "Sign in to your AquaBotAI account to track water parameters, manage your fish and livestock, schedule maintenance, and get AI-powered aquarium care recommendations.",
    images: ["/og-image.png"],
  },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
