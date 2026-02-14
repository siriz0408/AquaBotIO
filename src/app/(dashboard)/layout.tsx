import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BottomTabBar } from "@/components/navigation/bottom-tab-bar";
import { DesktopNavbar } from "@/components/navigation/desktop-navbar";
import { PageTransition } from "@/components/navigation/page-transition";
import { SkipLink } from "@/components/accessibility";

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
      {/* Skip link for keyboard navigation (WCAG 2.4.1) */}
      <SkipLink />
      {/* Desktop Navigation - hidden on mobile */}
      <DesktopNavbar />
      {/* Main content landmark (WCAG 1.3.1) */}
      <main id="main-content" tabIndex={-1} className="outline-none">
        <PageTransition>
          {children}
        </PageTransition>
      </main>
      {/* Mobile Navigation - hidden on desktop */}
      <BottomTabBar />
    </div>
  );
}
