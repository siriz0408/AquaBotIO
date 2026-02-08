import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BottomTabBar } from "@/components/navigation/bottom-tab-bar";
import { DesktopNavbar } from "@/components/navigation/desktop-navbar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-brand-bg pb-20 md:pb-0">
      {/* Desktop Navigation - hidden on mobile */}
      <DesktopNavbar />
      {children}
      {/* Mobile Navigation - hidden on desktop */}
      <BottomTabBar />
    </div>
  );
}
