import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign Up",
  description: "Create your free AquaBotAI account. Start your 14-day trial with AI-powered aquarium management, water parameter tracking, and personalized care advice.",
  openGraph: {
    title: "Sign Up | AquaBotAI",
    description: "Create your free AquaBotAI account. Start your 14-day trial with AI-powered aquarium management, water parameter tracking, and personalized care advice.",
  },
};

export default function SignupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
