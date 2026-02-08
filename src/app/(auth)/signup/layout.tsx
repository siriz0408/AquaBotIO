import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Your Free Aquarium Account",
  description: "Start your 14-day free trial of AquaBotAI. Get AI-powered aquarium management, water parameter tracking, fish compatibility checks, and personalized care advice. No credit card required.",
  openGraph: {
    title: "Create Your Free Aquarium Account | AquaBotAI",
    description: "Start your 14-day free trial of AquaBotAI. Get AI-powered aquarium management, water parameter tracking, fish compatibility checks, and personalized care advice. No credit card required.",
    images: ["/og-image.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Create Your Free Aquarium Account | AquaBotAI",
    description: "Start your 14-day free trial of AquaBotAI. Get AI-powered aquarium management, water parameter tracking, fish compatibility checks, and personalized care advice. No credit card required.",
    images: ["/og-image.png"],
  },
};

export default function SignupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
