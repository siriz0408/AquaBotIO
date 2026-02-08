import { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    template: "%s | AquaBotAI",
    default: "Account | AquaBotAI",
  },
  description: "Sign in or create an account to manage your aquariums with AI-powered insights.",
  openGraph: {
    title: "Account | AquaBotAI",
    description: "Sign in or create an account to manage your aquariums with AI-powered insights.",
  },
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
