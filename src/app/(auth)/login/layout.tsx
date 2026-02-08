import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login to Your Aquarium Dashboard",
  description: "Sign in to AquaBotAI to track water parameters, manage fish, schedule maintenance, and get AI-powered aquarium care advice.",
  alternates: {
    canonical: "https://aquabotai-mu.vercel.app/login",
  },
  openGraph: {
    title: "Login to Your Aquarium Dashboard | AquaBotAI",
    description: "Sign in to AquaBotAI to track water parameters, manage fish, schedule maintenance, and get AI-powered aquarium care advice.",
    images: ["/og-image.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Login to Your Aquarium Dashboard | AquaBotAI",
    description: "Sign in to AquaBotAI to track water parameters, manage fish, schedule maintenance, and get AI-powered aquarium care advice.",
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
