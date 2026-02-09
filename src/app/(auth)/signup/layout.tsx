import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Your Free Aquarium Account",
  description: "Start your 7-day free trial. Get AI aquarium management, water tracking, fish compatibility, and care advice. No credit card required.",
  alternates: {
    canonical: "https://aquabotai-mu.vercel.app/signup",
  },
  openGraph: {
    title: "Create Your Free Aquarium Account | AquaBotAI",
    description: "Start your 7-day free trial. Get AI aquarium management, water tracking, fish compatibility, and care advice. No credit card required.",
    images: ["/og-image.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Create Your Free Aquarium Account | AquaBotAI",
    description: "Start your 7-day free trial. Get AI aquarium management, water tracking, fish compatibility, and care advice. No credit card required.",
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
