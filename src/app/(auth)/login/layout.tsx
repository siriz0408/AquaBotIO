import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login",
  description: "Sign in to your AquaBotAI account to track water parameters, manage livestock, and get AI-powered aquarium care advice.",
  openGraph: {
    title: "Login | AquaBotAI",
    description: "Sign in to your AquaBotAI account to track water parameters, manage livestock, and get AI-powered aquarium care advice.",
  },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
