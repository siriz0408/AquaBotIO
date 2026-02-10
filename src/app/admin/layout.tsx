import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminHeader } from "@/components/admin/admin-header";

export const metadata = {
  title: "Admin Portal | AquaBotAI",
  description: "AquaBotAI Admin Portal",
  robots: "noindex, nofollow", // R-013.29: Not indexed by search engines
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Check if user is an admin
  const { data: adminProfile } = await supabase
    .from("admin_profiles")
    .select("role, user_id")
    .eq("user_id", user.id)
    .single();

  if (!adminProfile) {
    // Not an admin - redirect to user dashboard
    redirect("/dashboard");
  }

  // Get user display info
  const { data: userData } = await supabase
    .from("users")
    .select("email, display_name")
    .eq("id", user.id)
    .single();

  const adminUser = {
    id: user.id,
    email: userData?.email || user.email || "",
    display_name: userData?.display_name || null,
    role: adminProfile.role as "super_admin" | "content_admin" | "support_admin",
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Admin Sidebar */}
      <AdminSidebar adminRole={adminUser.role} />

      {/* Main content area */}
      <div className="lg:pl-64">
        {/* Admin Header */}
        <AdminHeader adminUser={adminUser} />

        {/* Page content */}
        <main className="p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
